import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Wallet, Gift, Link as LinkIcon, Zap, BadgeCheck, UserCheck, ListChecks } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { connectWallet, disconnectWallet, getCurrentUser } from '@/data';

const ProfileSection = ({ user, refreshUserData }) => {
  const [walletInput, setWalletInput] = useState('');
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
          toast({
            title: "Wallet Connected",
            description: `Wallet ${walletInput.slice(0, 6)}...${walletInput.slice(-4)} added.`,
            variant: "success",
          });
        } else {
          toast({ title: "Error", description: "Failed to connect wallet.", variant: "destructive" });
        }
      } else {
        toast({
          title: "Invalid Wallet",
          description: "Must be 48 chars starting with EQ or UQ.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Missing Address",
        description: "Please enter your TON wallet address.",
        variant: "warning",
      });
    }
  };

  const handleDisconnectWallet = async () => {
    if (!user?.id) return;
    const success = await disconnectWallet(user.id);
    if (success) {
      const updatedUser = await getCurrentUser(user.id);
      if (updatedUser) refreshUserData(updatedUser);
      toast({ title: "Wallet Disconnected" });
    } else {
      toast({ title: "Error", description: "Failed to disconnect wallet.", variant: "destructive" });
    }
  };

  const displayName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username || `User ${user.id}`;
  const fallbackAvatar = displayName?.substring(0, 2).toUpperCase() || 'U';
  const tasksDoneCount = user.tasks ? Object.values(user.tasks).filter(Boolean).length : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <div className="rounded-xl p-4 sm:p-6 bg-gradient-to-br from-sky-900 to-black text-white shadow-xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 ring ring-sky-500 shadow-md">
            <AvatarImage src={user.profilePicUrl || `https://avatar.vercel.sh/${user.username || user.id}.png`} />
            <AvatarFallback>{fallbackAvatar}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xl font-semibold">{displayName}</p>
            <p className="text-sky-300 text-sm">@{user.username || 'telegram_user'}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-white/10 p-4 rounded-xl flex flex-col items-center">
            <Zap className="h-5 w-5 text-yellow-400 mb-1" />
            <p className="text-sm text-sky-200">Energy</p>
            <p className="font-bold text-lg">{user.energy || 0}</p>
          </div>
          <div className="bg-white/10 p-4 rounded-xl flex flex-col items-center">
            <BadgeCheck className="h-5 w-5 text-green-400 mb-1" />
            <p className="text-sm text-sky-200">Balance</p>
            <p className="font-bold text-lg">{user.balance || 0} STON</p>
          </div>
          <div className="bg-white/10 p-4 rounded-xl flex flex-col items-center">
            <UserCheck className="h-5 w-5 text-indigo-400 mb-1" />
            <p className="text-sm text-sky-200">Referrals</p>
            <p className="font-bold text-lg">{user.referrals || 0}</p>
          </div>
          <div className="bg-white/10 p-4 rounded-xl flex flex-col items-center">
            <ListChecks className="h-5 w-5 text-teal-400 mb-1" />
            <p className="text-sm text-sky-200">Tasks Done</p>
            <p className="font-bold text-lg">{tasksDoneCount}</p>
          </div>
        </div>

        {/* Wallet Section */}
        <div className="space-y-3">
          <p className="text-sky-300 font-medium">TON Wallet</p>
          {user.wallet ? (
            <div className="bg-white/10 p-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono break-all">
                <Wallet className="text-green-400 w-4 h-4" />
                <span>{user.wallet}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleDisconnectWallet} className="text-red-400">
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Enter your TON wallet"
                value={walletInput}
                onChange={(e) => setWalletInput(e.target.value)}
                className="bg-white/10 border-white/20 text-sm text-white placeholder:text-sky-300"
              />
              <Button onClick={handleConnectWallet} size="sm" className="bg-sky-600 hover:bg-sky-700 text-white">
                <LinkIcon className="h-4 w-4 mr-1" /> Connect
              </Button>
            </div>
          )}
        </div>

        {/* Claim Rewards */}
        <Button
          size="lg"
          variant="outline"
          disabled
          className="w-full border-white/30 text-sky-300 hover:bg-white/10"
        >
          <Gift className="mr-2 h-5 w-5" /> Claim Rewards (Coming Soon)
        </Button>
      </div>
    </motion.div>
  );
};

export default ProfileSection;
