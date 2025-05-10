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
    const newUserRef = db.collection('users').doc(newUserId);
    const referredByRef = db.collection('users').doc(referredById);

    const [newUserSnap, referredBySnap] = await Promise.all([
      newUserRef.get(),
      referredByRef.get()
    ]);

    if (!referredBySnap.exists) {
      return res.status(404).json({ success: false, message: 'Referrer not found.' });
    }

    // If user doesn't exist, create with default structure
    if (!newUserSnap.exists) {
      await newUserRef.set(defaultFirestoreUser(newUserId, null, null, null, referredById));
    } else {
      const newUserData = newUserSnap.data();
      if (newUserData.invitedBy) {
        return res.status(409).json({ success: false, message: 'User already referred by someone.' });
      }

      await newUserRef.update({ invitedBy: referredById });
    }

    // Update the referrer
    await referredByRef.update({
      referrals: FieldValue.increment(1),
      balance: FieldValue.increment(50),
      referredUsers: FieldValue.arrayUnion(newUserId)
    });

    return res.status(200).json({
      success: true,
      message: 'Referral processed successfully.'
    });

  } catch (error) {
    console.error('Referral error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}
