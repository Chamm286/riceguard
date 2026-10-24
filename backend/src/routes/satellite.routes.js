const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { verifyToken } = require("../middlewares/auth.middleware");

const N8N_URL = (process.env.N8N_URL || "http://localhost:5678").replace(/\/+$/, "");
const AI_URL = (process.env.AI_URL || "http://localhost:5001").replace(/\/+$/, "");

function classify(ndvi) {
  if (ndvi >= 0.6) return { status: "healthy", label: "Khỏe mạnh", color: "Xanh đậm" };
  if (ndvi >= 0.3) return { status: "moderate", label: "Trung bình", color: "Xanh nhạt" };
  return { status: "stressed", label: "Căng thẳng", color: "Vàng/nâu" };
}

async function latestFeature(fieldId) {
  const result = await pool.query(
    `SELECT f.*, fl.name AS field_name, fl.area_hectare,
            mp.prediction, mp.confidence, mp.model_name
     FROM features f
     LEFT JOIN fields fl ON fl.id = f.field_id
     LEFT JOIN LATERAL (
       SELECT prediction, confidence, model_name
       FROM model_predictions
       WHERE feature_id = f.id
       ORDER BY id DESC LIMIT 1
     ) mp ON true
     WHERE ($1::int IS NULL OR f.field_id = $1::int)
     ORDER BY f.window_end DESC
     LIMIT 1`,
    [fieldId || null]
  );
  return result.rows[0] || null;
}

async function askAI(ndvi, ndre, lat, lng) {
  try {
    const res = await fetch(`${AI_URL}/api/analyze-sentinel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ndvi, ndre, lat, lng }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

router.get("/summary", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT ON (f.field_id)
        f.id, f.field_id, f.ndvi_avg, f.ndre_avg, f.window_end,
        fl.name AS field_name, fl.area_hectare,
        mp.prediction, mp.confidence
      FROM features f
      LEFT JOIN fields fl ON fl.id = f.field_id
      LEFT JOIN LATERAL (
        SELECT prediction, confidence FROM model_predictions
        WHERE feature_id = f.id ORDER BY id DESC LIMIT 1
      ) mp ON true
      ORDER BY f.field_id, f.window_end DESC
    `);

    const items = result.rows.map((row) => {
      const ndvi = Number(row.ndvi_avg || 0);
      return {
        ...row,
        ndvi_avg: ndvi,
        ndre_avg: Number(row.ndre_avg || 0),
        ...classify(ndvi),
      };
    });

    res.json({
      success: true,
      data: {
        items,
        total: items.length,
        healthy: items.filter((i) => i.status === "healthy").length,
        moderate: items.filter((i) => i.status === "moderate").length,
        stressed: items.filter((i) => i.status === "stressed").length,
        avgNdvi: items.length
          ? Math.round((items.reduce((sum, i) => sum + i.ndvi_avg, 0) / items.length) * 1000) / 1000
          : null,
      },
    });
  } catch (err) {
    console.error("❌ /api/satellite/summary:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/analyze", verifyToken, async (req, res) => {
  const { lat, lng, zoom = 16, field_name = "Vùng canh tác", field_id } = req.body || {};
  if (!lat || !lng) {
    return res.status(400).json({ success: false, message: "Thiếu lat/lng" });
  }

  try {
    const n8nRes = await fetch(`${N8N_URL}/webhook/satellite-analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lng, zoom, field_name, field_id }),
      signal: AbortSignal.timeout(60000),
    });

    if (n8nRes.ok) {
      const data = await n8nRes.json();
      return res.json(data);
    }
  } catch (err) {
    console.log(`⚠️ n8n satellite webhook không khả dụng: ${err.message}`);
  }

  try {
    const feature = await latestFeature(field_id);
    if (!feature || feature.ndvi_avg === null) {
      return res.status(422).json({
        success: false,
        code: "NDVI_NOT_READY",
        message: field_id
          ? "Chưa có dữ liệu NDVI cho vùng này. Hãy chạy workflow Sentinel-2 trước."
          : "Chưa xác định được vùng canh tác để lấy dữ liệu NDVI. Hãy truyền field_id.",
      });
    }

    const ndvi = Number(feature.ndvi_avg);
    const ndre = Number(feature.ndre_avg || 0);
    const cls = classify(ndvi);
    const ai = await askAI(ndvi, ndre, lat, lng);
    const prediction = feature.prediction || ai?.disease || cls.label;
    const confidence = Number(feature.confidence ?? ai?.confidence ?? 0);
    const stress = ndvi < 0.3;
    const moderate = ndvi >= 0.3 && ndvi < 0.6;

    res.json({
      success: true,
      source: "features",
      data: {
        dien_tich: feature.area_hectare ? `${Number(feature.area_hectare).toFixed(2)} ha` : "—",
        mau_sac: cls.color,
        mat_do: ndvi >= 0.6 ? "Dày" : ndvi >= 0.3 ? "Trung bình" : "Thưa",
        tinh_trang: prediction,
        bat_thuong: stress
          ? `NDVI thấp (${ndvi.toFixed(2)}) - cây có dấu hiệu căng thẳng`
          : moderate
            ? `NDVI trung bình (${ndvi.toFixed(2)}) - cần theo dõi`
            : null,
        khuyen_nghi: stress
          ? "Kiểm tra sâu bệnh và độ ẩm đất, cân nhắc xử lý sinh học."
          : moderate
            ? "Theo dõi thêm 3-5 ngày và kiểm tra dinh dưỡng."
            : "Duy trì chăm sóc hiện tại.",
        ai_full: ai ? JSON.stringify(ai) : null,
        ndvi,
        ndre,
        confidence,
        model_name: feature.model_name || null,
        field_id: feature.field_id,
        field_name: feature.field_name || field_name,
        window_end: feature.window_end,
      },
    });
  } catch (err) {
    console.error("❌ /api/satellite/analyze:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
