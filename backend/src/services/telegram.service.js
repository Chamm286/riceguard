async function sendTelegramMessage(text, chatId) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const target = chatId || process.env.TELEGRAM_CHAT_ID;

  if (!token) {
    const error = new Error('Chưa cấu hình TELEGRAM_BOT_TOKEN trên backend');
    error.code = 'TELEGRAM_NOT_CONFIGURED';
    throw error;
  }
  if (!target) {
    const error = new Error('Không tìm thấy chat_id Telegram của người nhận');
    error.code = 'TELEGRAM_CHAT_ID_MISSING';
    throw error;
  }

  let response;
  let body = null;
  try {
    response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: target, text, parse_mode: 'HTML' }),
      signal: AbortSignal.timeout(15000),
    });
    body = await response.json().catch(() => null);
  } catch (err) {
    const error = new Error(err.message || 'Không kết nối được Telegram API');
    error.code = 'TELEGRAM_SEND_FAILED';
    throw error;
  }

  if (!response.ok || !body?.ok) {
    const error = new Error(body?.description || 'Telegram từ chối gửi tin nhắn');
    error.code = 'TELEGRAM_SEND_FAILED';
    throw error;
  }

  return body.result;
}

module.exports = { sendTelegramMessage };
