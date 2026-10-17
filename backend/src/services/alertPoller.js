const pool = require('../config/database');

let lastAlertId = 0;

// Khởi tạo lastAlertId = max id hiện tại
async function initLastAlertId() {
  try {
    const result = await pool.query('SELECT MAX(id) as max_id FROM alerts');
    lastAlertId = result.rows[0]?.max_id || 0;
    console.log(`📊 Alert poller: bắt đầu từ ID ${lastAlertId}`);
  } catch (err) {
    console.error('❌ Init lastAlertId error:', err.message);
  }
}

// Poll alerts mới mỗi 2s
function startAlertPoller() {
  initLastAlertId();

  setInterval(async () => {
    try {
      const result = await pool.query(
        'SELECT * FROM alerts WHERE id > $1 ORDER BY id ASC LIMIT 10',
        [lastAlertId]
      );

      if (result.rows.length > 0) {
        for (const alert of result.rows) {
          console.log(`🔔 Alert mới: #${alert.id} - ${alert.title}`);
          
          if (global.emitNewAlert) {
            global.emitNewAlert(alert);
          }
          
          lastAlertId = alert.id;
        }
      }
    } catch (err) {
      // Silent error
    }
  }, 2000);

  console.log('✅ Alert poller started (mỗi 2s)');
}

module.exports = { startAlertPoller };
