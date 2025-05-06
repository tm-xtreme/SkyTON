
import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Wallet, Link as LinkIcon, Gift, Zap } from 'lucide-react'; // Added Zap for energy
import { useToast } from '@/components/ui/use-toast';
import { connectWallet, disconnectWallet, getCurrentUser } from '@/data'; // Use Firestore functions, changed getUser to getCurrentUser
import { UserContext } from '@/App'; // Import UserContext

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

// Removed tasks prop, activeTasksCount logic needs rethinking if needed
const ProfileSection = ({ user, refreshUserData }) => {
  // user and refreshUserData (which is setUser from context) are passed directly
  const [walletInput, setWalletInput] = useState('');
  const { toast } = useToast();

  const handleConnectWallet = async () => {
    if (!user?.id) return; // Use user.id which is the document ID (telegramId)
    if (walletInput.trim()) {
      // Basic TON address format check (example, improve if needed)
      if (walletInput.length === 48 && (walletInput.startsWith('EQ') || walletInput.startsWith('UQ'))) {
         const success = await connectWallet(user.id, walletInput);
         if (success) {
             // Fetch updated user data and update context
             const updatedUser = await getCurrentUser(user.id); // Use getCurrentUser
             if(updatedUser) refreshUserData(updatedUser);
             setWalletInput('');
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
            variant: "warning",
         });
    }
  };

  const handleDisconnectWallet = async () => {
    if (!user?.id) return; // Use user.id
    const success = await disconnectWallet(user.id);
    if (success) {
        // Fetch updated user data and update context
        const updatedUser = await getCurrentUser(user.id); // Use getCurrentUser
        if(updatedUser) refreshUserData(updatedUser);
        toast({
          title: "Wallet Disconnected",
          variant: "default",
        });
    } else {
         toast({ title: "Error", description: "Failed to disconnect wallet.", variant: "destructive" });
    }
  };

  // Calculate tasks done based on the user's tasks map
  const tasksDoneCount = user.tasks ? Object.values(user.tasks).filter(Boolean).length : 0;
  // activeTasksCount needs to be derived from the fetched tasks definitions if needed elsewhere

  // Format full name for display
  const displayName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username || `User ${user.id}`;
  const fallbackAvatar = displayName?.substring(0, 2).toUpperCase() || 'U';

  return (
    <motion.div variants={itemVariants}>
      <Card>
        <CardHeader className="flex flex-row items-center space-x-4 pb-4">
          <Avatar className="h-16 w-16 border-2 border-primary">
            <AvatarImage src={user.profilePicUrl || `https://avatar.vercel.sh/${user.username || user.id}.png?size=64`} alt={user.username || user.id} />
            <AvatarFallback>{fallbackAvatar}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl">{displayName}</CardTitle>
            <CardDescription>@{user.username || 'telegram_user'}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
           <div>
              <span className="font-semibold text-muted-foreground">Balance:</span>
              <p className="text-lg font-bold text-primary">{user.balance?.toLocaleString() || '0'} STON</p>
           </div>
           <div>
              <span className="font-semibold text-muted-foreground">Energy:</span>
              <p className="text-lg font-bold flex items-center">
                <Zap className="h-4 w-4 mr-1 text-yellow-500" /> {user.energy?.toLocaleString() || '0'}
              </p>
           </div>
           <div>
              <span className="font-semibold text-muted-foreground">Referrals:</span>
              <p className="text-lg font-bold">{user.referrals || 0}</p>
           </div>
           <div>
              <span className="font-semibold text-muted-foreground">Tasks Done:</span>
              {/* Display count based on user.tasks map */}
              <p className="text-lg font-bold">{tasksDoneCount}</p>
              {/* <p className="text-lg font-bold">{tasksDoneCount} / {activeTasksCount}</p> */}
           </div>
        </CardContent>
         <CardFooter className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
           <div className="flex-grow">
              <span className="font-semibold text-muted-foreground block mb-1">TON Wallet:</span>
              {user.wallet ? ( // Use 'wallet' field from Firestore
                <div className="flex items-center gap-2 flex-wrap">
                  <Wallet className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="font-mono text-xs bg-muted px-2 py-1 rounded break-all">
                    {user.wallet}
                  </span>
                   <Button variant="ghost" size="sm" onClick={handleDisconnectWallet}>Disconnect</Button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                  <Input
                    type="text"
                    placeholder="Enter your TON wallet address"
                    value={walletInput}
                    onChange={(e) => setWalletInput(e.target.value)}
                    className="max-w-xs text-xs h-9"
                  />
                  <Button size="sm" onClick={handleConnectWallet}>
                    <LinkIcon className="mr-2 h-4 w-4" /> Connect
                  </Button>
                </div>
              )}
           </div>
            <Button size="sm" variant="secondary" disabled className="mt-2 sm:mt-0">
              <Gift className="mr-2 h-4 w-4" /> Claim Rewards (Soon)
            </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default ProfileSection;
  