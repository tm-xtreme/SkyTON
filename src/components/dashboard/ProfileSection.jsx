import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Wallet, Link as LinkIcon, Gift, Zap, User, CheckCircle, Users } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { connectWallet, disconnectWallet, getCurrentUser } from '@/data';
import { UserContext } from '@/App';
import { AlertDialog, AlertDialogContent, AlertDialogTrigger } from '@/components/ui/alert-dialog';

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
            title: 'Wallet Connected',
            description: `Wallet ${walletInput.substring(0, 6)}...${walletInput.substring(walletInput.length - 4)} added.`,
            variant: 'success',
          });
        } else {
          toast({ title: 'Error', description: 'Failed to connect wallet.', variant: 'destructive' });
        }
      } else {
        toast({
          title: 'Invalid Wallet Address',
          description: 'Please enter a valid TON wallet address.',
          variant: 'destructive',
        });
      }
    } else {
      toast({ title: 'Wallet Address Required', description: 'Please enter your TON wallet address.', variant: 'warning' });
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

  const tasksDoneCount = user.tasks ? Object.values(user.tasks).filter(Boolean).length : 0;
  const displayName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username || `User ${user.id}`;
  const fallbackAvatar = displayName?.substring(0, 2).toUpperCase() || 'U';

  return (
    <motion.div className="w-full min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-4 text-white flex flex-col items-center">
      <Card className="w-full max-w-sm rounded-3xl shadow-lg bg-[#1e293b] border-none text-center">
        <CardHeader className="flex flex-col items-center">
          <Avatar className="h-20 w-20 border-4 border-blue-500">
            <AvatarImage src={user.profilePicUrl || `https://avatar.vercel.sh/${user.username || user.id}.png?size=64`} />
            <AvatarFallback>{fallbackAvatar}</AvatarFallback>
          </Avatar>
          <h2 className="mt-4 text-2xl font-bold leading-tight">{displayName}</h2>
          <p className="text-sm text-blue-300">@{user.username || 'telegram_user'}</p>
        </CardHeader>

        <CardContent className="grid grid-cols-2 gap-3 py-4 text-sm">
          <div className="bg-slate-800 rounded-xl py-3 px-2 flex flex-col items-center">
            <Zap className="text-yellow-400 mb-1" />
            <p>Energy</p>
            <p className="font-bold text-lg">{user.energy || 0}</p>
          </div>
          <div className="bg-slate-800 rounded-xl py-3 px-2 flex flex-col items-center">
            <CheckCircle className="text-green-400 mb-1" />
            <p>Balance</p>
            <p className="font-bold text-lg">{user.balance || 0} STON</p>
          </div>
          <div className="bg-slate-800 rounded-xl py-3 px-2 flex flex-col items-center">
            <Users className="text-purple-400 mb-1" />
            <p>Referrals</p>
            <p className="font-bold text-lg">{user.referrals || 0}</p>
          </div>
          <div className="bg-slate-800 rounded-xl py-3 px-2 flex flex-col items-center">
            <User className="text-cyan-400 mb-1" />
            <p>Tasks Done</p>
            <p className="font-bold text-lg">{tasksDoneCount}</p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col items-center w-full gap-4">
          <div className="w-full">
            <p className="text-left text-sm text-blue-300 mb-1 font-medium">TON Wallet</p>
            {user.wallet ? (
              <div className="flex flex-col items-center">
                <div className="text-xs bg-slate-700 px-3 py-2 rounded-md break-all">{user.wallet}</div>
                <Button variant="link" className="text-xs text-red-400 mt-2" onClick={handleDisconnectWallet}>Disconnect</Button>
              </div>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="default" className="w-full"><Wallet className="mr-2 h-4 w-4" /> Connect Wallet</Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-slate-800 text-white border border-slate-600 rounded-2xl">
                  <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-bold text-center">Connect Your TON Wallet</h3>
                    <Input
                      type="text"
                      placeholder="Enter your TON wallet address"
                      value={walletInput}
                      onChange={(e) => setWalletInput(e.target.value)}
                      className="text-sm bg-slate-700 border-none focus:ring-2 ring-blue-500"
                    />
                    <Button className="w-full" onClick={handleConnectWallet}>
                      <LinkIcon className="mr-2 h-4 w-4" /> Connect
                    </Button>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          <Button disabled variant="secondary" className="w-full opacity-50">
            <Gift className="mr-2 h-4 w-4" /> Claim Rewards (Coming Soon)
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default ProfileSection;
