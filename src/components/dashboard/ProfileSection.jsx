import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Wallet, Link as LinkIcon, Gift, Zap, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { connectWallet, disconnectWallet, getCurrentUser } from '@/data';
import { UserContext } from '@/App';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from '@/components/ui/alert-dialog';

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

const ProfileSection = ({ user, refreshUserData }) => {
  const [walletInput, setWalletInput] = useState('');
  const [showWalletDialog, setShowWalletDialog] = useState(false);
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
          setShowWalletDialog(false);
          toast({
            title: "Wallet Connected",
            description: `Wallet ${walletInput.substring(0, 6)}...${walletInput.substring(walletInput.length - 4)} added.`
          });
        } else {
          toast({ title: "Error", description: "Failed to connect wallet." });
        }
      } else {
        toast({
          title: "Invalid Wallet Address",
          description: "Please enter a valid TON wallet address (should be 48 chars starting EQ/UQ)."
        });
      }
    } else {
      toast({
        title: "Wallet Address Required",
        description: "Please enter your TON wallet address."
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
      toast({ title: "Error", description: "Failed to disconnect wallet." });
    }
  };

  const tasksDoneCount = user.tasks ? Object.values(user.tasks).filter(Boolean).length : 0;
  const displayName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username || `User ${user.id}`;
  const fallbackAvatar = displayName?.substring(0, 2).toUpperCase() || 'U';

  return (
    <>
      <motion.div variants={itemVariants} className="w-full min-h-[calc(100vh-80px)] bg-gradient-to-br from-gray-900 to-black text-white px-4 py-6 flex flex-col items-center">
        <Card className="w-full max-w-md bg-transparent border-none shadow-none">
          <CardHeader className="items-center text-center">
            <Avatar className="h-20 w-20 border-2 border-sky-400 shadow-md">
              <AvatarImage src={user.profilePicUrl || `https://avatar.vercel.sh/${user.username || user.id}.png?size=64`} alt={user.username || user.id} />
              <AvatarFallback>{fallbackAvatar}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl mt-3 font-bold">{displayName}</CardTitle>
            <p className="text-sm text-blue-300">@{user.username || 'telegram_user'}</p>
          </CardHeader>

          <CardContent className="grid grid-cols-2 gap-4 w-full mt-6 px-2">
            <div className="bg-slate-800 rounded-xl p-3 flex flex-col items-center text-sm">
              <Zap className="h-5 w-5 text-yellow-400 mb-1" />
              <p className="text-muted-foreground">Energy</p>
              <p className="text-lg font-bold text-white">{user.energy || 0}</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-3 flex flex-col items-center text-sm">
              <Wallet className="h-5 w-5 text-green-400 mb-1" />
              <p className="text-muted-foreground">Balance</p>
              <p className="text-lg font-bold text-white">{user.balance || 0} STON</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-3 flex flex-col items-center text-sm">
              <span className="text-purple-400">👥</span>
              <p className="text-muted-foreground">Referrals</p>
              <p className="text-lg font-bold text-white">{user.referrals || 0}</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-3 flex flex-col items-center text-sm">
              <span className="text-cyan-400">✅</span>
              <p className="text-muted-foreground">Tasks Done</p>
              <p className="text-lg font-bold text-white">{tasksDoneCount}</p>
            </div>
          </CardContent>

          <CardFooter className="w-full flex flex-col mt-6 gap-4 px-2">
            <p className="text-left w-full font-semibold text-blue-400">TON Wallet</p>
            {user.wallet ? (
              <div className="flex flex-col gap-1 bg-slate-900 rounded-xl px-4 py-2 w-full text-sm shadow-md">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-green-400" />
                  <span className="font-mono text-xs break-all">{user.wallet}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleDisconnectWallet} className="self-start text-red-400 px-2">
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button className="bg-purple-600 hover:bg-purple-700 text-white w-full" onClick={() => setShowWalletDialog(true)}>
                <Wallet className="h-4 w-4 mr-2" /> Connect Wallet
              </Button>
            )}
            <Button variant="secondary" disabled className="w-full bg-gray-700 text-gray-300">
              <Gift className="mr-2 h-4 w-4" /> Claim Rewards (Coming Soon)
            </Button>
          </CardFooter>
        </Card>
      </motion.div>

      <AlertDialog open={showWalletDialog} onOpenChange={setShowWalletDialog}>
        <AlertDialogContent className="bg-slate-900 text-white rounded-xl">
          <div className="flex justify-between items-center">
            <AlertDialogTitle className="text-lg">Connect Wallet</AlertDialogTitle>
            <button onClick={() => setShowWalletDialog(false)} className="text-white hover:text-red-400">
              <X className="w-5 h-5" />
            </button>
          </div>
          <AlertDialogDescription className="text-sm text-muted-foreground mb-4">
            Enter your TON wallet address (48 characters, starts with EQ/UQ).
          </AlertDialogDescription>
          <Input
            type="text"
            placeholder="EQXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
            value={walletInput}
            onChange={(e) => setWalletInput(e.target.value)}
            className="mb-3"
          />
          <Button onClick={handleConnectWallet} className="w-full bg-purple-600 hover:bg-purple-700">
            <LinkIcon className="mr-2 h-4 w-4" /> Connect Wallet
          </Button>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProfileSection;
