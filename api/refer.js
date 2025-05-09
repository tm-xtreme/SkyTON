// src/api/refer.js

import { db } from '../src/firebaseConfig.js'; // Adjust this path if needed
import { doc, getDoc, setDoc, updateDoc, increment, arrayUnion } from 'firebase/firestore';

export default async function handler(req, res) {
  const { api, new: newUserId, referreby: referredById } = req.query;

  // Validate API key
  if (!api || api !== process.env.ADMIN_API_KEY) {
    return res.status(403).json({ success: false, message: 'Invalid API key.' });
  }

  if (!newUserId || !referredById || newUserId === referredById) {
    return res.status(400).json({ success: false, message: 'Invalid referral data.' });
  }

  try {
    const newUserRef = doc(db, 'users', newUserId);
    const referredByRef = doc(db, 'users', referredById);

    const [newUserSnap, referredBySnap] = await Promise.all([
      getDoc(newUserRef),
      getDoc(referredByRef)
    ]);

    if (!newUserSnap.exists() || !referredBySnap.exists()) {
      return res.status(404).json({ success: false, message: 'User(s) not found.' });
    }

    const newUserData = newUserSnap.data();
    if (newUserData.invitedBy) {
      return res.status(409).json({ success: false, message: 'User already referred by someone.' });
    }

    // Reward settings (can be updated later in admin panel)
    const rewardAmount = 50;

    await Promise.all([
      updateDoc(newUserRef, {
        invitedBy: referredById
      }),
      updateDoc(referredByRef, {
        referrals: increment(1),
        balance: increment(rewardAmount),
        referredUsers: arrayUnion(newUserId)
      })
    ]);

    return res.status(200).json({
      success: true,
      message: 'Referral successful and data updated.'
    });

  } catch (error) {
    console.error('Referral error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}
