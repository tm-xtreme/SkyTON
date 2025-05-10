import { db } from '../src/lib/serverFirebase.js';
import { FieldValue } from 'firebase-admin/firestore';
import { defaultFirestoreUser } from '../src/data/defaults.js';

export default async function handler(req, res) {
  const { api, new: newUserId, referreby: referredById } = req.query;

  if (!api || api !== process.env.ADMIN_API_KEY) {
    return res.status(403).json({ success: false, message: 'Invalid API key.' });
  }

  if (!newUserId || !referredById || newUserId === referredById) {
    return res.status(400).json({ success: false, message: 'Invalid referral data.' });
  }

  try {
    const usersRef = db.collection('users');
    const tasksRef = db.collection('tasks');

    const newUserRef = usersRef.doc(newUserId);
    const referredByRef = usersRef.doc(referredById);
    const referTaskRef = tasksRef.doc('task_refer_friend');

    const [newUserSnap, referredBySnap, referTaskSnap] = await Promise.all([
      newUserRef.get(),
      referredByRef.get(),
      referTaskRef.get()
    ]);

    if (!referredBySnap.exists) {
      return res.status(404).json({ success: false, message: 'Referrer not found.' });
    }

    if (!referTaskSnap.exists) {
      return res.status(500).json({ success: false, message: 'Referral task config missing.' });
    }

    const rewardAmount = referTaskSnap.data().reward || 0;

    if (newUserSnap.exists) {
      return res.status(409).json({ success: false, message: 'User already joined.' });
    }

    // Create the new user with referral metadata
    await newUserRef.set(defaultFirestoreUser(newUserId, null, null, null, referredById));

    // Update referrer’s stats with dynamic reward
    await referredByRef.update({
      referrals: FieldValue.increment(1),
      balance: FieldValue.increment(rewardAmount),
      referredUsers: FieldValue.arrayUnion(newUserId)
    });

    return res.status(200).json({
      success: true,
      message: `Referral successful. ${rewardAmount} STON rewarded to referrer.`
    });

  } catch (error) {
    console.error('Referral error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}
