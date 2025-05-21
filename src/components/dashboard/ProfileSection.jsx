import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Wallet, Gift, Zap, Users, CheckCircle, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { connectWallet, disconnectWallet, getCurrentUser } from '@/data';
import { UserContext } from '@/App';

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const ProfileSection = ({ user, refreshUserData }) => {
  const [walletInput, setWalletInput] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const { toast } = useToast();

  const handleConnectWallet = async () => {
    if (!user?.id || !walletInput.trim()) return;

    if (walletInput.length === 48 && (walletInput.startsWith('EQ') || walletInput.startsWith('UQ'))) {
      const success = await connectWallet(user.id, walletInput);
      if (success) {
        const updatedUser = await getCurrentUser(user.id);
        if (updatedUser) refreshUserData(updatedUser);
        setWalletInput('');
        setShowWalletModal(false);
        toast({
          title: "Wallet Connected",
          description: `Wallet ${walletInput.slice(0, 6)}...${walletInput.slice(-4)} connected.`,
          variant: "success",
        });
      } else {
        toast({ title: "Error", description: "Failed to connect wallet.", variant: "destructive" });
      }
    } else {
      toast({
        title: "Invalid Address",
        description: "Address must be 48 characters and start with EQ or UQ.",
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
    }
  };

  const displayName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username || `User ${user.id}`;
  const fallbackAvatar = displayName?.substring(0, 2).toUpperCase() || 'U';
  const tasksDone = user.tasks ? Object.values(user.tasks).filter(Boolean).length : 0;

  return (
    <motion.div
      className="p-4"
      initial="hidden"
      animate="visible"
      variants={itemVariants}
    >
      <Card className="rounded-2xl shadow-xl bg-gradient-to-br from-slate-900 to-gray-900 text-white">
        <CardHeader className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-blue-500">
            <AvatarImage src={user.profilePicUrl || `https://avatar.vercel.sh/${user.username || user.id}.png?size=64`} alt={user.username || user.id} />
            <AvatarFallback>{fallbackAvatar}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-xl font-bold tracking-tight">{displayName}</CardTitle>
            <CardDescription className="text-sm text-blue-300">@{user.username || 'telegram_user'}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm text-white">
          <div className="bg-slate-800/70 p-3 rounded-lg flex flex-col items-center">
            <Zap className="text-yellow-400 mb-1" />
            <p className="text-xs text-slate-300">Energy</p>
            <p className="text-lg font-semibold">{user.energy || 0}</p>
          </div>
          <div className="bg-slate-800/70 p-3 rounded-lg flex flex-col items-center">
            <CheckCircle className="text-green-400 mb-1" />
            <p className="text-xs text-slate-300">Balance</p>
            <p className="text-lg font-semibold">{user.balance || 0} STON</p>
          </div>
          <div className="bg-slate-800/70 p-3 rounded-lg flex flex-col items-center">
            <Users className="text-purple-400 mb-1" />
            <p className="text-xs text-slate-300">Referrals</p>
            <p className="text-lg font-semibold">{user.referrals || 0}</p>
          </div>
          <div className="bg-slate-800/70 p-3 rounded-lg flex flex-col items-center">
            <CheckCircle className="text-cyan-400 mb-1" />
            <p className="text-xs text-slate-300">Tasks Done</p>
            <p className="text-lg font-semibold">{tasksDone}</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-3 pt-4">
          <p className="text-sm font-semibold text-blue-300 w-full text-left">TON Wallet</p>
          {user.wallet ? (
            <div className="flex items-center gap-2">
              <Wallet className="text-green-400" />
              <p className="font-mono text-xs bg-slate-700 rounded px-2 py-1">{user.wallet}</p>
              <Button variant="destructive" size="sm" onClick={handleDisconnectWallet}>
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow"
              onClick={() => setShowWalletModal(true)}
            >
              <Wallet className="mr-2 h-4 w-4" /> Connect Wallet
            </Button>
          )}

          {showWalletModal && (
            <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center">
              <motion.div
                className="bg-white rounded-xl p-6 w-11/12 max-w-sm shadow-2xl text-gray-800"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Enter TON Wallet</h2>
                  <Button variant="ghost" size="icon" onClick={() => setShowWalletModal(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  placeholder="EQ... or UQ..."
                  value={walletInput}
                  onChange={(e) => setWalletInput(e.target.value)}
                  className="mb-4"
                />
                <Button onClick={handleConnectWallet} className="w-full bg-blue-600 text-white hover:bg-blue-700">
                  Connect Wallet
                </Button>
              </motion.div>
            </div>
          )}

          <Button variant="secondary" disabled className="w-full">
            <Gift className="mr-2 h-4 w-4" /> Claim Rewards (Coming Soon)
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default ProfileSection;
