export default async function handler(req, res) {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ success: false, message: 'Password required.' });
  }

  if (password === process.env.ADMIN_CODE) {
    return res.status(200).json({ success: true });
  }

  return res.status(403).json({ success: false, message: 'Invalid password.' });
}
