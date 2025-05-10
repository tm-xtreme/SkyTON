import { db } from '../src/lib/serverFirebase.js';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  arrayUnion
} from 'firebase-admin/firestore';
import { defaultFirestoreUser } from '../src/data/defaults.js';

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

    if (!referredBySnap.exists()) {
      return res.status(404).json({ success: false, message: 'Referrer not found.' });
    }

    // If new user doesn't exist, create with basic fields
    if (!newUserSnap.exists()) {
      await setDoc(newUserRef, defaultFirestoreUser(newUserId, null, null, null, referredById));
    } else {
      const newUserData = newUserSnap.data();
      if (newUserData.invitedBy) {
        return res.status(409).json({ success: false, message: 'User already referred by someone.' });
      }

      await updateDoc(newUserRef, {
        invitedBy: referredById
      });
    }

    // Update referrer info
    await updateDoc(referredByRef, {
      referrals: increment(1),
      balance: increment(50), // You can make this dynamic later
      referredUsers: arrayUnion(newUserId)
    });

    return res.status(200).json({
      success: true,
      message: 'Referral processed. New user created or updated.'
    });

  } catch (error) {
    console.error('Referral error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}
