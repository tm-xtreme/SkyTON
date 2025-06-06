import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Copy, Loader2, QrCode, X, Users, Share2, Gift, UserPlus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { generateReferralLink } from '@/data';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import QRCode from '@/components/ui/QRCode';

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
  const [showQRCodePopup, setShowQRCodePopup] = useState(false);
  const [copying, setCopying] = useState(false);

  const referralLink = user.referralLink || generateReferralLink(user.id);

  const copyReferralLink = () => {
    if (!referralLink) {
      toast({ title: "Referral link not available", variant: "destructive", className: "bg-[#1a1a1a] text-white" });
      return;
    }
    navigator.clipboard.writeText(referralLink)
      .then(() => {
        setCopying(true);
        toast({ title: "Referral Link Copied!", variant: "success", className: "bg-[#1a1a1a] text-white" });
        setTimeout(() => setCopying(false), 1200);
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
    <div
      className="relative w-full min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#1a1a1a] text-white overflow-y-auto"
      style={{
        touchAction: "pan-y",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
      }}
    >
      <div className="flex flex-col items-center px-4 py-4 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md flex flex-col items-center gap-4"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <h2 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Invite & Earn
            </h2>
            <p className="text-xs text-gray-400 mt-1">Share your link with friends and earn STON</p>
          </motion.div>

          {/* Referral Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full"
          >
            <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 backdrop-blur-sm border border-green-500/30 p-3 rounded-2xl text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Gift className="h-5 w-5 text-green-400" />
                <p className="text-sm font-semibold text-white">Total Referrals</p>
              </div>
              <p className="text-2xl font-bold text-green-400">{user.referrals || 0}</p>
              <p className="text-xs text-gray-300 mt-1">
                Keep inviting to earn more STON!
              </p>
            </div>
          </motion.div>

          {/* Referral Link Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full"
          >
            <h3 className="text-sm font-semibold text-center mb-2 text-gray-300">
              Your Referral Link
            </h3>
            <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-600/50 rounded-2xl p-2">
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  readOnly
                  value={referralLink}
                  className="flex-grow text-xs bg-transparent border-none text-white"
                />
                <button
                  type="button"
                  className="flex items-center justify-center p-1 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 transition-all duration-200 active:scale-95"
                  onClick={copyReferralLink}
                >
                  <Copy
                    className={`h-4 w-4 ${
                      copying ? "text-green-400" : "text-blue-400"
                    } transition-colors`}
                  />
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center p-1 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 transition-all duration-200 active:scale-95"
                  onClick={() => setShowQRCodePopup(true)}
                >
                  <QrCode className="h-4 w-4 text-purple-400" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Share Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full space-y-2"
          >
            <Button 
              onClick={shareOnTelegram} 
              className="w-full h-10 bg-[#0088cc] hover:bg-[#006699] text-white rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <TelegramIcon className="w-4 h-4 mr-2" />
              Share on Telegram
            </Button>
          </motion.div>

          {/* Referred Users Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="w-full"
          >
            {loadingReferrals ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-gray-400 text-sm">Loading referrals...</span>
              </div>
            ) : referredUsers.length > 0 ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-blue-400" />
                  <p className="text-sm font-semibold text-white">Referred Users</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {referredUsers.map((u, index) => (
                    <motion.div
                      key={u.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-600/50 p-2 rounded-xl flex items-center gap-2 hover:scale-105 transition-all duration-300"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={u.photo} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-700 text-white text-xs">
                          {u.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs truncate text-white">{u.name}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <div className="bg-gray-800/50 border border-gray-600/50 rounded-2xl p-6">
                  <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 text-sm">No referrals yet</p>
                  <p className="text-gray-500 text-xs mt-2">
                    Start sharing your link to see your referrals here
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Referrer Info */}
          {referrerInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="w-full"
            >
              <div className="bg-gradient-to-r from-blue-600/20 to-blue-800/20 backdrop-blur-sm border border-blue-500/30 p-3 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 border-2 border-blue-400/50">
                    <AvatarImage src={referrerInfo.photo} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-700 text-white text-xs">
                      {referrerInfo.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs text-blue-400 font-medium">Referred by</p>
                    <p className="text-sm text-white font-semibold">{referrerInfo.name}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tips Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="w-full"
          >
            <div className="bg-gradient-to-r from-orange-600/10 to-orange-800/10 backdrop-blur-sm border border-orange-500/20 p-3 rounded-2xl">
              <h3 className="text-sm font-semibold text-orange-400 mb-2 text-center">
                💡 Referral Tips
              </h3>
              <div className="space-y-2 text-xs text-gray-300">
                <p>• Share your link on social media platforms</p>
                <p>• Invite friends and family members</p>
                <p>• Help your referrals complete their first tasks</p>
                <p>• Earn STON for every successful referral</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* QR Code Popup */}
        {showQRCodePopup && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-600/50 text-white w-full max-w-sm p-4 rounded-2xl shadow-2xl relative"
            >
              {/* Close Button */}
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                onClick={() => setShowQRCodePopup(false)}
              >
                <X className="w-6 h-6" />
              </button>
              
              <h3 className="text-lg font-bold mb-4 text-center text-white">Your QR Code</h3>
              
              {/* QR Code - Centered */}
              <div className="flex justify-center mb-4">
                <div className="bg-white p-3 rounded-xl">
                  <QRCode value={referralLink} size={180} />
                </div>
              </div>
              
              {/* Referral Link Display */}
              <div className="bg-gray-800/50 border border-gray-600/50 p-3 rounded-xl mb-4">
                <p className="text-xs text-gray-400 mb-2 text-center">Referral Link</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-white break-all flex-1 text-center">{referralLink}</p>
                  <button
                    type="button"
                    className="flex items-center justify-center p-1 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 transition-all duration-200 active:scale-95 flex-shrink-0"
                    onClick={copyReferralLink}
                  >
                    <Copy
                      className={`h-4 w-4 ${
                        copying ? "text-green-400" : "text-blue-400"
                      } transition-colors`}
                    />
                  </button>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="space-y-2">
                <Button 
                  onClick={shareOnTelegram}
                  className="w-full h-10 bg-[#0088cc] hover:bg-[#006699] text-white rounded-xl"
                >
                  <TelegramIcon className="w-4 h-4 mr-2" />
                  Share on Telegram
                </Button>
                <Button 
                  onClick={() => setShowQRCodePopup(false)} 
                  variant="outline"
                  className="w-full h-10 bg-transparent border-2 border-gray-500/50 text-gray-300 hover:bg-gray-600/20 hover:border-gray-400 rounded-xl"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferralSection;
