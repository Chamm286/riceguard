const pool = require('../config/database');
const n8nController = require('./n8n.controller');

// ============ CREATE ALERT + TRIGGER n8n ============
exports.create = async (req, res) => {
  try {
    const {
      feature_id, field_id, alert_type, category, severity,
      title, description, lead_time_minutes
    } = req.body;

    if (!title || !severity) {
      return res.status(400).json({ success: false, message: 'Thiếu title hoặc severity' });
    }

    const result = await pool.query(
      `INSERT INTO alerts (feature_id, field_id, alert_type, category, severity, title, description, lead_time_minutes, status)
       VALUES ($1::int, $2::int, $3::varchar, $4::varchar, $5::varchar, $6::varchar, $7::text, $8::int, 'new')
       RETURNING *`,
      [
        feature_id || null,
        field_id || null,
        alert_type || 'security',
        category || 'unknown',
        severity,
        title,
        description || '',
        lead_time_minutes || null,
      ]
    );

    const newAlert = result.rows[0];

    // Ghi log history
    await pool.query(
      `INSERT INTO alert_history (alert_id, action, new_status, note)
       VALUES ($1::int, 'created', 'new', 'Alert tự động tạo')`,
      [newAlert.id]
    );

    // Trigger n8n webhook (không chờ kết quả)
    n8nController.triggerN8nWebhook('alert-triage', {
      id: newAlert.id,
      title: newAlert.title,
      severity: newAlert.severity,
      description: newAlert.description,
      category: newAlert.category,
      alert_type: newAlert.alert_type,
      field_id: newAlert.field_id,
    }).catch((err) => console.error('n8n trigger error:', err));

    res.json({
      success: true,
      data: newAlert,
      message: 'Alert đã tạo và gửi tới n8n',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ============ GET ALL ============
exports.getAll = async (req, res) => {
  try {
    const { severity, status, category, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let where = [];
    let params = [];
    let idx = 1;

    if (severity) { where.push(`severity = $${idx++}::varchar`); params.push(severity); }
    if (status) { where.push(`status = $${idx++}::varchar`); params.push(status); }
    if (category) { where.push(`category = $${idx++}::varchar`); params.push(category); }
    if (search) {
      where.push(`(title ILIKE $${idx}::text OR description ILIKE $${idx}::text)`);
      params.push(`%${search}%`); idx++;
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const countResult = await pool.query(`SELECT COUNT(*) FROM alerts ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    const dataQuery = `
      SELECT a.*, f.name AS field_name
      FROM alerts a
      LEFT JOIN fields f ON a.field_id = f.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT $${idx++}::int OFFSET $${idx++}::int
    `;
    const dataResult = await pool.query(dataQuery, [...params, parseInt(limit), parseInt(offset)]);

    res.json({
      success: true,
      data: dataResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ============ GET BY ID ============
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT a.*, f.name AS field_name, f.location AS field_location
       FROM alerts a
       LEFT JOIN fields f ON a.field_id = f.id
       WHERE a.id = $1::int`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy alert' });
    }

    const history = await pool.query(
      'SELECT * FROM alert_history WHERE alert_id = $1::int ORDER BY created_at DESC',
      [id]
    );

    res.json({ success: true, data: { ...result.rows[0], history: history.rows } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ============ UPDATE STATUS ============
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    const userId = req.user.id;

    const current = await pool.query('SELECT status FROM alerts WHERE id = $1::int', [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy alert' });
    }
    const oldStatus = current.rows[0].status;

    await pool.query(
      `UPDATE alerts
       SET status = $1::varchar,
           updated_at = NOW(),
           resolved_at = CASE WHEN $1::varchar IN ('resolved','ignored') THEN NOW() ELSE resolved_at END,
           resolved_by = CASE WHEN $1::varchar IN ('resolved','ignored') THEN $2::int ELSE resolved_by END,
           resolution_note = COALESCE($3::text, resolution_note)
       WHERE id = $4::int`,
      [status, userId, note || null, id]
    );

    await pool.query(
      `INSERT INTO alert_history (alert_id, action, old_status, new_status, changed_by, note)
       VALUES ($1::int, 'status_changed', $2::varchar, $3::varchar, $4::int, $5::text)`,
      [id, oldStatus, status, userId, note || null]
    );

    res.json({ success: true, message: 'Cập nhật thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
