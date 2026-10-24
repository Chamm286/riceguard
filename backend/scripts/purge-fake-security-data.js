const pool = require('../src/config/database');

const FAKE_IPS = [
  '1.1.1.1',
  '1.2.3.4',
  '2.2.2.2',
  '5.5.5.5',
  '6.6.6.6',
  '7.7.7.7',
  '8.8.8.8',
  '9.8.7.6',
  '9.9.9.9',
  '10.0.0.99',
  '45.67.89.12',
  '45.123.45.67',
  '62.102.148.68',
  '91.240.118.172',
  '103.45.67.89',
  '103.152.112.162',
  '141.98.10.41',
  '185.220.101.42',
  '192.168.1.5',
  '192.168.1.10',
  '192.168.1.15',
  '192.168.1.22',
  '192.168.1.100',
  '192.168.1.200',
  '192.168.40.100',
  '192.168.99.99',
  '198.98.56.23',
  '203.0.113.77',
  '203.113.45.67',
];

const INVALID_IPS = ['', '0.0.0.0', '0.26.04.1', 'localhost', 'undefined', 'null'];

async function main() {
  const ips = [...FAKE_IPS, ...INVALID_IPS];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const alertIds = await client.query('SELECT id FROM alerts WHERE ip_address = ANY($1::varchar[])', [ips]);
    if (alertIds.rows.length) {
      const ids = alertIds.rows.map((row) => row.id);
      await client.query('DELETE FROM alert_history WHERE alert_id = ANY($1::int[])', [ids]);
      await client.query('DELETE FROM alerts WHERE id = ANY($1::int[])', [ids]);
    }

    const logs = await client.query('DELETE FROM logs WHERE ip_address = ANY($1::varchar[])', [ips]);
    const threats = await client.query('DELETE FROM threats WHERE ip_address = ANY($1::varchar[])', [ips]);
    const geo = await client.query('DELETE FROM ip_geolocation WHERE ip_address = ANY($1::varchar[])', [ips]);
    const blocked = await client.query('DELETE FROM blocked_ips WHERE ip = ANY($1::varchar[])', [ips]);

    await client.query('COMMIT');
    console.log(JSON.stringify({
      removed: {
        alerts: alertIds.rows.length,
        logs: logs.rowCount,
        threats: threats.rowCount,
        geolocation: geo.rowCount,
        blocked: blocked.rowCount,
      },
    }, null, 2));
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
