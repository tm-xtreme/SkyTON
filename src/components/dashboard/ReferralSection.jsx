
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { generateReferralLink } from '@/data'; // Import the generator function

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};


const ReferralSection = ({ user }) => {
  const { toast } = useToast();

  // Ensure referralLink is generated correctly even if missing from user data initially
  // Use user.id which is the Firestore document ID (same as telegramId)
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

  return (
    <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Invite & Earn</CardTitle>
            <CardDescription>Share your link to invite friends and earn rewards for each referral.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <p className="text-sm">Your unique referral link:</p>
             <div className="flex items-center gap-2 bg-muted p-2 rounded-md">
                <Input type="text" readOnly value={referralLink} className="flex-grow text-xs bg-transparent border-none focus-visible:ring-0" />
                <Button variant="ghost" size="icon" onClick={copyReferralLink} disabled={!referralLink}>
                    <Copy className="h-4 w-4" />
                </Button>
             </div>
             <p className="text-sm text-muted-foreground">You have successfully referred <span className="font-bold text-primary">{user.referrals || 0}</span> friends.</p>
             {user.invitedBy && (
                <p className="text-xs text-muted-foreground italic">You were invited by user ID: {user.invitedBy}</p>
             )}
          </CardContent>
        </Card>
    </motion.div>
  );
};

export default ReferralSection;
  