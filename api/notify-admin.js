export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, adminChatId } = req.body;
  const botToken = process.env.TG_BOT_TOKEN;

  if (!botToken || !adminChatId) {
    return res.status(500).json({ error: 'Missing configuration' });
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: adminChatId,
          text: message,
          parse_mode: 'HTML',
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending admin notification:', error);
    return res.status(500).json({ error: 'Failed to send notification' });
  }
}
