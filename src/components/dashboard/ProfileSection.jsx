import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Card, CardContent, CardFooter, CardHeader, CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Wallet, Link as LinkIcon, Gift, Zap } from 'lucide-react';
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
            variant: "success"
          });
        } else {
          toast({ title: "Error", description: "Failed to connect wallet.", variant: "destructive" });
        }
      } else {
        toast({
          title: "Invalid Wallet",
          description: "TON address should start with EQ/UQ and be 48 characters.",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Missing Wallet",
        description: "Please enter your TON wallet address.",
        variant: "warning"
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <Card className="shadow-lg border border-slate-200 dark:border-slate-700 bg-gradient-to-tr from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <CardHeader className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-700">
          <Avatar className="w-16 h-16 ring-2 ring-primary shadow-md">
            <AvatarImage src={user.profilePicUrl || `https://avatar.vercel.sh/${user.username || user.id}.png?size=64`} />
            <AvatarFallback>{fallbackAvatar}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl font-bold">{displayName}</CardTitle>
            <p className="text-muted-foreground text-sm">@{user.username || 'telegram_user'}</p>
          </div>
        </CardHeader>

        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-6 p-6 text-center text-sm">
          <div className="flex flex-col items-center">
            <span className="text-muted-foreground font-semibold">Balance</span>
            <p className="text-lg font-extrabold text-primary">{user.balance?.toLocaleString() || '0'} STON</p>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-muted-foreground font-semibold">Energy</span>
            <p className="text-lg font-extrabold text-yellow-500 flex items-center gap-1">
              <Zap className="w-4 h-4" /> {user.energy?.toLocaleString() || '0'}
            </p>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-muted-foreground font-semibold">Referrals</span>
            <p className="text-lg font-extrabold">{user.referrals || 0}</p>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-muted-foreground font-semibold">Tasks Done</span>
            <p className="text-lg font-extrabold">{tasksDoneCount}</p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-6 pb-6 pt-0">
          <div className="flex flex-col gap-2 w-full">
            <p className="text-sm text-muted-foreground font-semibold">TON Wallet</p>
            {user.wallet ? (
              <div className="flex items-center flex-wrap gap-3">
                <Wallet className="h-4 w-4 text-green-500" />
                <span className="font-mono text-xs bg-muted px-3 py-1 rounded">
                  {user.wallet}
                </span>
                <Button size="sm" variant="outline" onClick={handleDisconnectWallet}>Disconnect</Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <Input
                  placeholder="TON wallet address"
                  value={walletInput}
                  onChange={(e) => setWalletInput(e.target.value)}
                  className="text-xs"
                />
                <Button onClick={handleConnectWallet} size="sm" className="gap-1">
                  <LinkIcon className="h-4 w-4" /> Connect
                </Button>
              </div>
            )}
          </div>

          <Button disabled variant="secondary" className="opacity-80">
            <Gift className="w-4 h-4 mr-1" /> Claim Rewards (Coming Soon)
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default ProfileSection;
