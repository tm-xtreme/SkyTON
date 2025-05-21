import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Wallet, Link as LinkIcon, Gift, Zap, Users, CheckCircle, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { connectWallet, disconnectWallet, getCurrentUser } from '@/data';
import { UserContext } from '@/App';
import AlertDialog from '@/components/ui/alert-dialog';

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
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0e0e13] via-[#0a0a0f] to-[#050509] flex flex-col justify-between px-4 py-6 overflow-hidden">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div className="flex flex-col items-center text-white">
          <Avatar className="h-24 w-24 border-4 border-blue-500 mb-4">
            <AvatarImage src={user.profilePicUrl || `https://avatar.vercel.sh/${user.username || user.id}.png?size=64`} alt={user.username || user.id} />
            <AvatarFallback>{fallbackAvatar}</AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-bold text-center drop-shadow-md">{displayName}</h2>
          <p className="text-sm text-blue-400">@{user.username || 'telegram_user'}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-[#161B22] rounded-xl p-4 flex flex-col items-center">
            <Zap className="text-yellow-400 mb-1" />
            <p className="text-sm text-muted-foreground">Energy</p>
            <p className="text-lg font-bold">{user.energy?.toLocaleString() || '0'}</p>
          </div>
          <div className="bg-[#161B22] rounded-xl p-4 flex flex-col items-center">
            <CheckCircle className="text-green-400 mb-1" />
            <p className="text-sm text-muted-foreground">Balance</p>
            <p className="text-lg font-bold">{user.balance?.toLocaleString() || '0'} STON</p>
          </div>
          <div className="bg-[#161B22] rounded-xl p-4 flex flex-col items-center">
            <Users className="text-purple-400 mb-1" />
            <p className="text-sm text-muted-foreground">Referrals</p>
            <p className="text-lg font-bold">{user.referrals || 0}</p>
          </div>
          <div className="bg-[#161B22] rounded-xl p-4 flex flex-col items-center">
            <CheckCircle className="text-cyan-400 mb-1" />
            <p className="text-sm text-muted-foreground">Tasks Done</p>
            <p className="text-lg font-bold">{tasksDoneCount}</p>
          </div>
        </div>

        <div className="mt-6 px-2">
          <p className="text-sm text-blue-300 mb-2">TON Wallet</p>
          {user.wallet ? (
            <div className="flex items-center justify-between bg-[#161B22] rounded-xl p-3">
              <span className="text-xs font-mono text-white break-all">{user.wallet}</span>
              <Button variant="ghost" size="sm" onClick={handleDisconnectWallet}>Disconnect</Button>
            </div>
          ) : (
            <Button onClick={() => setShowDialog(true)} className="w-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white">
              <Wallet className="mr-2" /> Connect Wallet
            </Button>
          )}
        </div>

        <div className="mt-4 px-2">
          <Button size="sm" variant="secondary" disabled className="w-full opacity-60 cursor-not-allowed">
            <Gift className="mr-2" /> Claim Rewards (Coming Soon)
          </Button>
        </div>
      </motion.div>

      {showDialog && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="bg-[#121212] w-11/12 max-w-sm p-6 rounded-xl shadow-xl relative">
            <button onClick={() => setShowDialog(false)} className="absolute top-2 right-2 text-white hover:text-red-500">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold mb-4 text-white">Enter TON Wallet Address</h3>
            <Input
              type="text"
              placeholder="EQ..."
              value={walletInput}
              onChange={(e) => setWalletInput(e.target.value)}
              className="mb-4 text-xs"
            />
            <Button onClick={handleConnectWallet} className="w-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white">
              <LinkIcon className="mr-2 h-4 w-4" /> Connect
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSection;
