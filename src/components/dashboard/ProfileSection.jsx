import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Wallet, Gift, Zap, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { connectWallet, disconnectWallet, getCurrentUser } from '@/data';

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

const ProfileSection = ({ user, refreshUserData }) => {
  const [walletInput, setWalletInput] = useState('');
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

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
            description: `Connected to ${walletInput.slice(0, 6)}...${walletInput.slice(-4)}`,
            variant: "success"
          });
          setOpen(false);
        } else {
          toast({ title: "Error", description: "Failed to connect wallet.", variant: "destructive" });
        }
      } else {
        toast({
          title: "Invalid Wallet",
          description: "TON wallet must start with EQ/UQ and be 48 characters long.",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Wallet Required",
        description: "Please enter your TON wallet address.",
        variant: "destructive"
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
    }
  };

  const tasksDoneCount = user.tasks ? Object.values(user.tasks).filter(Boolean).length : 0;
  const displayName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username || `User ${user.id}`;
  const fallbackAvatar = displayName?.substring(0, 2).toUpperCase() || 'U';

  return (
    <motion.div
      variants={itemVariants}
      className="app-fullscreen overflow-hidden"
    >
      <Card className="w-full max-w-md glass-card shadow-lg mt-6 sm:mt-12">
        <CardHeader className="flex flex-col items-center space-y-2">
          <Avatar className="h-20 w-20 border-2 border-primary">
            <AvatarImage src={user.profilePicUrl} alt={user.username || user.id} />
            <AvatarFallback>{fallbackAvatar}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-xl">{displayName}</CardTitle>
          <p className="text-sm text-muted-foreground">@{user.username || 'telegram_user'}</p>
        </CardHeader>

        <CardContent className="grid grid-cols-2 gap-4 text-sm py-2 px-4">
          <div>
            <p className="text-muted-foreground text-xs">Balance</p>
            <p className="text-lg font-bold">{user.balance?.toLocaleString() || 0} STON</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Energy</p>
            <p className="text-lg font-bold flex items-center gap-1">
              <Zap className="h-4 w-4 text-yellow-400" />
              {user.energy?.toLocaleString() || 0}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Referrals</p>
            <p className="text-lg font-bold">{user.referrals || 0}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Tasks Done</p>
            <p className="text-lg font-bold">{tasksDoneCount}</p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col w-full gap-4 px-4 pb-6">
          <div className="w-full">
            <p className="text-sm text-muted-foreground mb-1">Wallet</p>
            {user.wallet ? (
              <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                <div className="text-xs bg-muted px-3 py-1 rounded-md break-all font-mono">{user.wallet}</div>
                <Button variant="outline" size="sm" onClick={handleDisconnectWallet}>
                  Disconnect
                </Button>
              </div>
            ) : (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full justify-center" variant="default">
                    <Wallet className="h-4 w-4 mr-2" /> Connect Wallet
                  </Button>
                </DialogTrigger>
                <DialogContent className="dialog-glass border border-border">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Connect Wallet</h2>
                    <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <input
                    className="w-full border rounded-md px-3 py-2 text-sm bg-muted text-foreground placeholder:text-muted-foreground"
                    placeholder="TON Wallet Address"
                    value={walletInput}
                    onChange={(e) => setWalletInput(e.target.value)}
                  />
                  <Button className="w-full mt-3" onClick={handleConnectWallet}>
                    Connect
                  </Button>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <Button size="sm" disabled variant="secondary" className="w-full">
            <Gift className="mr-2 h-4 w-4" /> Claim Rewards (Soon)
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default ProfileSection;
