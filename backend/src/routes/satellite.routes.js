const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/auth.middleware");

// POST /api/satellite/analyze
// Proxy → n8n webhook D3
router.post("/analyze", verifyToken, async (req, res) => {
  try {
    const { lat, lng, zoom = 16, field_name = "Vùng canh tác", field_id } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: "Thiếu lat/lng" });
    }

    console.log(`🛰️ Gọi D3 cho ${field_name} (${lat}, ${lng})`);

    const n8nRes = await fetch("http://localhost:5678/webhook/satellite-analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lng, zoom, field_name, field_id }),
    });

    if (!n8nRes.ok) {
      return res.status(500).json({ 
        success: false, 
        message: `D3 error: ${n8nRes.status}` 
      });
    }

    const data = await n8nRes.json();
    console.log(`✅ D3 response:`, JSON.stringify(data).substring(0, 200));
    res.json(data);

  } catch (err) {
    console.error("❌ /api/satellite/analyze:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
