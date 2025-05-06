import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getLeaderboardData } from '@/data'; // Use Firestore function for leaderboard
import { Loader2, Trophy } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from "@/lib/utils";

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

const LeaderboardSection = ({ currentUserTelegramId }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      const data = await getLeaderboardData(); // Fetch leaderboard data
      setLeaderboard(data || []);
      setIsLoading(false);
    };

    fetchLeaderboard();
  }, []);

  const getRankSuffix = (rank) => {
    if (rank === 1) return 'st';
    if (rank === 2) return 'nd';
    if (rank === 3) return 'rd';
    return 'th';
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1:
        return "text-yellow-400";
      case 2:
        return "text-gray-400";
      case 3:
        return "text-yellow-600";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <motion.div variants={itemVariants}>
      <Card>
        <CardHeader>
          <CardTitle>Top Referrers</CardTitle>
          <CardDescription>See who's leading the referral race.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : leaderboard.length === 0 ? (
            <p className="text-center text-muted-foreground">No leaders yet. Start referring!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Rank</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Referrals</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((user, index) => {
                  const rank = index + 1;
                  const isCurrentUser = user.id === currentUserTelegramId;
                  const displayName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username || `User ${user.id.substring(0, 6)}`;
                  const fallbackAvatar = displayName?.substring(0, 2).toUpperCase() || 'U';

                  return (
                    <TableRow key={user.id} className={cn(isCurrentUser && "bg-primary/10")}>
                      <TableCell className="font-medium">
                        <span className={cn("flex items-center font-bold", getRankColor(rank))}>
                          {rank <= 3 && <Trophy className="h-4 w-4 mr-1" />}
                          {rank}{getRankSuffix(rank)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8 border">
                            <AvatarImage src={user.profilePicUrl || `https://avatar.vercel.sh/${user.username || user.id}.png?size=32`} alt={user.username || user.id} />
                            <AvatarFallback>{fallbackAvatar}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium truncate max-w-[150px] sm:max-w-xs">{displayName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">{user.referrals || 0}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default LeaderboardSection;
