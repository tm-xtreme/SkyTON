import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Copy, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { generateReferralLink } from '@/data';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const defaultAvatar = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQB_4gKwn8q2WBPTwnV14Jmh3B5g56SCiGEBA&usqp=CAU";

const ReferralSection = ({ user }) => {
  const { toast } = useToast();
  const [referredUsers, setReferredUsers] = useState([]);
  const [referrerInfo, setReferrerInfo] = useState(null);
  const [loadingReferrals, setLoadingReferrals] = useState(true);

  const referralLink = user.referralLink || generateReferralLink(user.id);

  const copyReferralLink = () => {
    if (!referralLink) {
      toast({ title: "Referral link not available", variant: "destructive", className: "bg-[#1a1a1a] text-white" });
      return;
    }
    navigator.clipboard.writeText(referralLink)
      .then(() => {
        toast({ title: "Referral Link Copied!", variant: "success", className: "bg-[#1a1a1a] text-white" });
      })
      .catch(err => {
        toast({ title: "Failed to copy link", description: err.message, variant: "destructive", className: "bg-[#1a1a1a] text-white" });
      });
  };

  useEffect(() => {
    const fetchReferredUsers = async () => {
      setLoadingReferrals(true);
      const referredIds = user.referredUsers || [];
      const fetchedUsers = await Promise.all(
        referredIds.map(async (uid) => {
          const ref = doc(db, 'users', uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data();
            return {
              id: uid,
              name: data.username || data.firstName || `User ${uid}`,
              photo: data.profilePicUrl || defaultAvatar
            };
          }
          return null;
        })
      );
      setReferredUsers(fetchedUsers.filter(Boolean));
      setLoadingReferrals(false);
    };

    const fetchReferrerInfo = async () => {
      if (user.invitedBy) {
        const ref = doc(db, 'users', user.invitedBy);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setReferrerInfo({
            id: user.invitedBy,
            name: data.username || data.firstName || `User ${user.invitedBy}`,
            photo: data.profilePicUrl || defaultAvatar
          });
        }
      }
    };

    fetchReferredUsers();
    fetchReferrerInfo();
  }, [user.referredUsers, user.invitedBy]);

  return (
    <motion.div className="w-full min-h-[100dvh] text-white px-4 pb-28 pt-6 bg-[#0f0f0f] overflow-y-auto">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-bold">Invite & Earn</h2>
          <p className="text-sm text-muted-foreground">Share your link with friends and earn STON</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm">Your Referral Link</p>
          <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl">
            <Input
              type="text"
              readOnly
              value={referralLink}
              className="flex-grow text-xs bg-transparent border-none text-white"
            />
            <Button size="icon" variant="ghost" onClick={copyReferralLink}>
              <Copy className="h-4 w-4 text-white" />
            </Button>
          </div>
        </div>

        <div className="bg-sky-900 p-4 rounded-xl text-center shadow">
          <p className="text-sm text-muted-foreground">Total Referrals</p>
          <p className="text-lg font-bold text-green-300">{user.referrals || 0}</p>
        </div>

        {loadingReferrals ? (
          <div className="flex justify-center items-center pt-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : referredUsers.length > 0 && (
          <div>
            <p className="text-sm font-semibold mb-2">Referred Users</p>
            <div className="grid grid-cols-2 gap-2">
              {referredUsers.map((u) => (
                <div key={u.id} className="flex items-center bg-white/5 p-2 rounded-md space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={u.photo} />
                    <AvatarFallback>{u.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm truncate">{u.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {referrerInfo && (
          <div className="flex items-center space-x-3 pt-4 border-t border-white/10 pt-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={referrerInfo.photo} />
              <AvatarFallback>{referrerInfo.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground italic">Referred by: {referrerInfo.name}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ReferralSection;
