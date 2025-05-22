import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Wallet, Link as LinkIcon, Gift, Zap, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { connectWallet, disconnectWallet, getCurrentUser } from '@/data';
import { UserContext } from '@/App';

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
            title: 'Wallet Connected',
            description: `Wallet ${walletInput.substring(0, 6)}...${walletInput.substring(walletInput.length - 4)} added.`,
            variant: 'success',
          });
        } else {
          toast({ title: 'Error', description: 'Failed to connect wallet.', variant: 'destructive' });
        }
      } else {
        toast({ title: 'Invalid Wallet', description: 'TON address must be 48 characters starting with EQ or UQ.', variant: 'destructive' });
      }
    } else {
      toast({ title: 'Wallet Required', description: 'Please enter your TON wallet address.', variant: 'destructive' });
    }
  };

  const handleDisconnectWallet = async () => {
    if (!user?.id) return;
    const success = await disconnectWallet(user.id);
    if (success) {
      const updatedUser = await getCurrentUser(user.id);
      if (updatedUser) refreshUserData(updatedUser);
      toast({ title: 'Wallet Disconnected', variant: 'default' });
    } else {
      toast({ title: 'Error', description: 'Failed to disconnect wallet.', variant: 'destructive' });
    }
  };

  const tasksDone = user.tasks ? Object.values(user.tasks).filter(Boolean).length : 0;
  const displayName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username || `User ${user.id}`;
  const fallbackAvatar = displayName.substring(0, 2).toUpperCase();

  return (
    <div className="w-full h-screen bg-[#0f0f0f] text-white flex flex-col items-center justify-center overflow-hidden px-4">
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        <Avatar className="h-24 w-24 border-4 border-sky-500">
          <AvatarImage src={user.profilePicUrl || `https://avatar.vercel.sh/${user.username || user.id}.png`} alt={user.username || user.id} />
          <AvatarFallback>{fallbackAvatar}</AvatarFallback>
        </Avatar>
        <div className="text-center">
          <h1 className="text-2xl font-bold">{displayName}</h1>
          <p className="text-sm text-muted-foreground">@{user.username || 'telegram_user'}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="bg-sky-900 p-4 rounded-xl text-center">
            <p className="text-sm text-muted-foreground">Balance</p>
            <p className="text-lg font-bold text-green-300">{user.balance?.toLocaleString() || '0'} STON</p>
          </div>
          <div className="bg-yellow-900 p-4 rounded-xl text-center">
            <p className="text-sm text-muted-foreground">Energy</p>
            <p className="text-lg font-bold text-yellow-300 flex items-center justify-center">
              <Zap className="h-4 w-4 mr-1" />{user.energy || 0}
            </p>
          </div>
          <div className="bg-purple-900 p-4 rounded-xl text-center">
            <p className="text-sm text-muted-foreground">Referrals</p>
            <p className="text-lg font-bold text-purple-300">{user.referrals || 0}</p>
          </div>
          <div className="bg-emerald-900 p-4 rounded-xl text-center">
            <p className="text-sm text-muted-foreground">Tasks Done</p>
            <p className="text-lg font-bold text-emerald-300">{tasksDone}</p>
          </div>
        </div>

        <div className="w-full mt-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">TON Wallet</p>
          {user.wallet ? (
            <div className="flex items-center justify-between bg-muted/10 p-3 rounded-xl">
              <span className="text-xs truncate">{user.wallet}</span>
              <Button size="sm" variant="ghost" onClick={handleDisconnectWallet}>Disconnect</Button>
            </div>
          ) : (
            <Button variant="secondary" className="w-full" onClick={() => setShowDialog(true)}>
              <Wallet className="mr-2 h-5 w-5" /> Connect Wallet
            </Button>
          )}
        </div>

        <Button variant="ghost" className="mt-4 w-full opacity-60 cursor-not-allowed" disabled>
          <Gift className="mr-2 h-5 w-5" /> Claim Rewards (Coming Soon)
        </Button>
      </div>

      {/* Wallet Input Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#1c1c1c] text-white w-[90%] max-w-sm p-6 rounded-xl shadow-xl relative"
          >
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
              onClick={() => setShowDialog(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold mb-4">Enter your TON Wallet</h2>
            <Input
              value={walletInput}
              onChange={(e) => setWalletInput(e.target.value)}
              placeholder="EQ... or UQ..."
              className="mb-4"
            />
            <Button className="w-full" onClick={handleConnectWallet}>
              <LinkIcon className="w-4 h-4 mr-2" /> Connect
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ProfileSection;
            
