import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Copy, Loader2, QrCode, X } from 'lucide-react'; // Added QrCode and X icons
import { useToast } from '@/components/ui/use-toast';
import { generateReferralLink } from '@/data';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import QRCode from '@/components/ui/QRCode'; // Import the QRCode component

const defaultAvatar = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQB_4gKwn8q2WBPTwnV14Jmh3B5g56SCiGEBA&usqp=CAU";

// Custom Telegram SVG Icon Component
const TelegramIcon = ({ className }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="currentColor"
  >
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const ReferralSection = ({ user }) => {
  const { toast } = useToast();
  const [referredUsers, setReferredUsers] = useState([]);
  const [referrerInfo, setReferrerInfo] = useState(null);
  const [loadingReferrals, setLoadingReferrals] = useState(true);
  const [showQRCodePopup, setShowQRCodePopup] = useState(false); // State for QR code popup

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

  const shareOnTelegram = () => {
    const encodedLink = encodeURIComponent(referralLink);
    const shareUrl = `https://t.me/share/url?url=${encodedLink}`;
    window.open(shareUrl, '_blank');
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
            <Button size="icon" variant="ghost" onClick={() => setShowQRCodePopup(true)}>
              <QrCode className="h-4 w-4 text-white" />
            </Button>
          </div>
        </div>

        {/* Share on Telegram Button - Centered */}
        <div className="flex justify-center">
          <Button 
            onClick={shareOnTelegram} 
            className="border rounded-lg border-white/30 bg-[#0088cc] hover:bg-[#006699] text-white px-6 py-2 flex items-center justify-center"
          >
            <TelegramIcon className="w-4 h-4 mr-2" />
            Share on Telegram
          </Button>
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

        {/* QR Code Popup */}
        {showQRCodePopup && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50 p-4">
            <div className="bg-[#1a1a1a] p-6 rounded-xl shadow-2xl text-center max-w-sm w-full border border-white/10">
              {/* Close Button */}
              <div className="flex justify-end mb-2">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => setShowQRCodePopup(false)}
                  className="text-white hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <h3 className="text-lg font-bold mb-4 text-white">Your QR Code</h3>
              
              {/* QR Code - Centered */}
              <div className="flex justify-center mb-4">
                <div className="bg-white p-4 rounded-lg">
                  <QRCode value={referralLink} size={200} />
                </div>
              </div>
              
              {/* Referral Link - Better Style */}
              <div className="bg-white/5 p-3 rounded-lg mb-4">
                <p className="text-xs text-gray-400 mb-1">Referral Link</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-white break-all flex-1">{referralLink}</p>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={copyReferralLink}
                    className="text-white hover:bg-white/10 flex-shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <Button 
                onClick={() => setShowQRCodePopup(false)} 
                className="w-full bg-sky-600 hover:bg-sky-700 text-white"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ReferralSection;
            
