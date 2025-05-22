import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Wallet, Link as LinkIcon, Gift, Zap, Users, CheckCircle, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { connectWallet, disconnectWallet, getCurrentUser } from '@/data';

const ProfileSection = ({ user, refreshUserData }) => {
  const [walletInput, setWalletInput] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  const handleConnectWallet = async () => {
    if (!user?.id) return;
    if (walletInput.trim()) {
      if (walletInput.length === 48 && (walletInput.startsWith('EQ') || walletInput.startsWith('UQ'))) {
        const success = await connectWallet(user.id, walletInput);
        if (success) {
          const updatedUser = await getCurrentUser(user.id);
          if (updatedUser) refreshUserData(updatedUser);
          setWalletInput('');
          setShowDialog(false);
          toast({
            title: "Wallet Connected",
            description: `Wallet ${walletInput.substring(0, 6)}...${walletInput.substring(walletInput.length - 4)} added.`,
            variant: "success",
          });
        } else {
          toast({ title: "Error", description: "Failed to connect wallet.", variant: "destructive" });
        }
      } else {
        toast({
          title: "Invalid Wallet Address",
          description: "Please enter a valid TON wallet address (should be 48 chars starting EQ/UQ).",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Wallet Address Required",
        description: "Please enter your TON wallet address.",
        variant: "destructive",
      });
    }
  };

  const handleDisconnectWallet = async () => {
    if (!user?.id) return;
    const success = await disconnectWallet(user.id);
    if (success) {
      const updatedUser = await getCurrentUser(user.id);
      if (updatedUser) refreshUserData(updatedUser);
      toast({ title: "Wallet Disconnected", variant: "default" });
    } else {
      toast({ title: "Error", description: "Failed to disconnect wallet.", variant: "destructive" });
    }
  };

  const tasksDoneCount = user.tasks ? Object.values(user.tasks).filter(Boolean).length : 0;
  const displayName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username || `User ${user.id}`;
  const fallbackAvatar = displayName?.substring(0, 2).toUpperCase() || 'U';

  return (
    <div
      className="fixed inset-0 h-screen w-screen bg-gradient-to-br from-[#0e0e13] via-[#0a0a0f] to-[#050509] flex flex-col px-4 py-6 overflow-hidden select-none"
      style={{ touchAction: 'none' }} // disables double-tap zoom on mobile
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col h-full"
      >
        <div className="flex flex-col items-center text-white mb-8">
          <Avatar className="h-24 w-24 border-4 border-blue-500 mb-4 shadow-lg shadow-blue-500/20">
            <AvatarImage src={user.profilePicUrl || `https://avatar.vercel.sh/${user.username || user.id}.png?size=64`} alt={user.username || user.id} />
            <AvatarFallback className="bg-blue-900">{fallbackAvatar}</AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-bold text-center drop-shadow-md">{displayName}</h2>
          <p className="text-sm text-blue-400">@{user.username || 'telegram_user'}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[#161B22] bg-opacity-80 rounded-xl p-4 flex flex-col items-center border border-[#232530]/50">
            <Zap className="text-yellow-400 mb-1 h-5 w-5" />
            <p className="text-xs text-gray-400">Energy</p>
            <p className="text-lg font-bold text-white">{user.energy?.toLocaleString() || '0'}</p>
          </div>
          <div className="bg-[#161B22] bg-opacity-80 rounded-xl p-4 flex flex-col items-center border border-[#232530]/50">
            <CheckCircle className="text-green-400 mb-1 h-5 w-5" />
            <p className="text-xs text-gray-400">Balance</p>
            <p className="text-lg font-bold text-white">{user.balance?.toLocaleString() || '0'} STON</p>
          </div>
          <div className="bg-[#161B22] bg-opacity-80 rounded-xl p-4 flex flex-col items-center border border-[#232530]/50">
            <Users className="text-purple-400 mb-1 h-5 w-5" />
            <p className="text-xs text-gray-400">Referrals</p>
            <p className="text-lg font-bold text-white">{user.referrals || 0}</p>
          </div>
          <div className="bg-[#161B22] bg-opacity-80 rounded-xl p-4 flex flex-col items-center border border-[#232530]/50">
            <CheckCircle className="text-cyan-400 mb-1 h-5 w-5" />
            <p className="text-xs text-gray-400">Tasks Done</p>
            <p className="text-lg font-bold text-white">{tasksDoneCount}</p>
          </div>
        </div>

        <div className="mb-5">
          <p className="text-sm text-blue-300 mb-2 font-medium">TON Wallet</p>
          {user.wallet ? (
            <div className="flex items-center justify-between bg-[#161B22] bg-opacity-80 rounded-xl p-3 border border-[#232530]/50">
              <span className="text-xs font-mono text-white break-all">{user.wallet}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDisconnectWallet}
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setShowDialog(true)}
              className="w-full bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white border-none shadow-lg shadow-blue-900/30"
            >
              <Wallet className="mr-2 h-4 w-4" /> Connect Wallet
            </Button>
          )}
        </div>

        <div className="mt-auto mb-4">
          <Button
            size="sm"
            variant="secondary"
            disabled
            className="w-full opacity-60 cursor-not-allowed bg-[#161B22] bg-opacity-80 border border-[#232530]/50 text-gray-300"
          >
            <Gift className="mr-2 h-4 w-4" /> Claim Rewards (Coming Soon)
          </Button>
        </div>
      </motion.div>

      {showDialog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="bg-[#161B22] bg-opacity-95 w-11/12 max-w-sm p-6 rounded-xl shadow-xl border border-[#232530]/50 relative"
          >
            <button
              onClick={() => setShowDialog(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold mb-5 text-white">Connect TON Wallet</h3>
            <Input
              type="text"
              placeholder="EQ..."
              value={walletInput}
              onChange={(e) => setWalletInput(e.target.value)}
              className="mb-4 text-xs bg-[#232530] border-[#232530] focus:border-blue-500 text-white"
            />
            <Button
              onClick={handleConnectWallet}
              className="w-full bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white shadow-lg shadow-blue-900/20"
            >
              <LinkIcon className="mr-2 h-4 w-4" /> Connect
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ProfileSection;
