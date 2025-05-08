// api/refer.js
import { db } from '../lib/firebaseAdmin';

export default async function handler(req, res) {
  const { api, new: newUserID, referreby } = req.query;

  if (api !== process.env.REFER_API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  if (!newUserID || !referreby || newUserID === referreby) {
    return res.status(400).json({ error: 'Invalid parameters' });
  }

  try {
    const newUserRef = db.collection('users').doc(newUserID);
    const referrerRef = db.collection('users').doc(referreby);

    const newUserSnap = await newUserRef.get();
    if (newUserSnap.exists && newUserSnap.data().referredBy) {
      return res.status(409).json({ error: 'User already referred' });
    }

    const referrerSnap = await referrerRef.get();
    if (!referrerSnap.exists) {
      return res.status(404).json({ error: 'Referrer not found' });
    }

    // Get reward amount from admin config
    const configSnap = await db.collection('config').doc('referral').get();
    const rewardAmount = configSnap.exists ? configSnap.data().rewardAmount || 0 : 0;

    await newUserRef.set({ referredBy: referreby, createdAt: Date.now() }, { merge: true });

    const referredUsers = referrerSnap.data().referredUsers || [];
    referredUsers.push(newUserID);

    await referrerRef.update({
      totalReferred: (referrerSnap.data().totalReferred || 0) + 1,
      balance: (referrerSnap.data().balance || 0) + rewardAmount,
      referredUsers,
    });

    return res.status(200).json({ message: 'Referral recorded successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
}
