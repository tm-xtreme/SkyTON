import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Copy } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { generateReferralLink } from '@/data';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

const defaultAvatar = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQB_4gKwn8q2WBPTwnV14Jmh3B5g56SCiGEBA&usqp=CAU";

const ReferralSection = ({ user }) => {
  const { toast } = useToast();
  const [referredUsers, setReferredUsers] = useState([]);
  const [referrerInfo, setReferrerInfo] = useState(null);

  const referralLink = user.referralLink || generateReferralLink(user.id);

  const copyReferralLink = () => {
    if (!referralLink) {
      toast({ title: "Referral link not available", variant: "warning" });
      return;
    }
    navigator.clipboard.writeText(referralLink)
      .then(() => {
        toast({ title: "Referral Link Copied!", variant: "success" });
      })
      .catch(err => {
        toast({ title: "Failed to copy link", description: err.message, variant: "destructive" });
      });
  };

  useEffect(() => {
    const fetchReferredUsers = async () => {
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
    <motion.div variants={itemVariants}>
      <Card>
        <CardHeader>
          <CardTitle>Invite & Earn</CardTitle>
          <CardDescription>
            Share your link to invite friends and earn rewards for each referral.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">Your unique referral link:</p>
          <div className="flex items-center gap-2 bg-muted p-2 rounded-md">
            <Input
              type="text"
              readOnly
              value={referralLink}
              className="flex-grow text-xs bg-transparent border-none focus-visible:ring-0"
            />
            <Button variant="ghost" size="icon" onClick={copyReferralLink} disabled={!referralLink}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            You have successfully referred <span className="font-bold text-primary">{user.referrals || 0}</span> friends.
          </p>

          {referredUsers.length > 0 && (
            <div>
              <p className="text-sm font-medium">Referred Users:</p>
              <div className="grid grid-cols-2 gap-2">
                {referredUsers.map((u) => (
                  <div key={u.id} className="flex items-center space-x-2 bg-secondary p-2 rounded-md">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={u.photo} />
                      <AvatarFallback>{u.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{u.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {referrerInfo && (
            <div className="flex items-center space-x-3 pt-4 border-t pt-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={referrerInfo.photo} />
                <AvatarFallback>{referrerInfo.name?.charAt(0) || "R"}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground italic">
                Referred by: {referrerInfo.name}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ReferralSection;
