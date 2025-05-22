import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getLeaderboardData } from '@/data';
import { Loader2, Trophy } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const LeaderboardSection = ({ currentUserTelegramId }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const data = await getLeaderboardData(filter); // Optional: update backend to handle filter
      setLeaderboard(data || []);
      setIsLoading(false);
    };

    fetchData();
  }, [filter]);

  const getRankSuffix = (rank) => {
    if (rank === 1) return 'st';
    if (rank === 2) return 'nd';
    if (rank === 3) return 'rd';
    return 'th';
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1:
        return 'text-yellow-400';
      case 2:
        return 'text-gray-400';
      case 3:
        return 'text-yellow-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <motion.div className="w-full min-h-[100dvh] text-white px-4 pb-28 pt-6 bg-[#0f0f0f] overflow-y-auto">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-bold">Top Referrers</h2>
          <p className="text-sm text-muted-foreground mb-2">See who's leading the referral race</p>
          <div className="flex justify-center gap-2">
            <button
              className={cn(
                'text-xs px-3 py-1 rounded-full',
                filter === 'all' ? 'bg-primary text-white' : 'bg-white/10 text-muted-foreground'
              )}
              onClick={() => setFilter('all')}
            >
              All Time
            </button>
            <button
              className={cn(
                'text-xs px-3 py-1 rounded-full',
                filter === 'weekly' ? 'bg-primary text-white' : 'bg-white/10 text-muted-foreground'
              )}
              onClick={() => setFilter('weekly')}
            >
              This Week
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : leaderboard.length === 0 ? (
          <p className="text-center text-muted-foreground">No leaders yet. Start referring!</p>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((user, index) => {
              const rank = index + 1;
              const isCurrentUser = user.id === currentUserTelegramId;
              const displayName = user.firstName
                ? `${user.firstName} ${user.lastName || ''}`.trim()
                : user.username || `User ${user.id}`;
              const profileImg =
                user.profilePicUrl ||
                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQB_4gKwn8q2WBPTwnV14Jmh3B5g56SCiGEBA&usqp=CAU';
              const fallbackAvatar = displayName?.substring(0, 2).toUpperCase() || 'U';

              return (
                <div
                  key={user.id}
                  className={cn(
                    'flex items-center justify-between bg-white/5 px-4 py-3 rounded-xl shadow',
                    isCurrentUser && 'border border-primary/60'
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <span className={cn('font-bold text-sm', getRankColor(rank))}>
                      {rank <= 3 && <Trophy className="inline-block h-4 w-4 mr-1" />}
                      {rank}
                      {getRankSuffix(rank)}
                    </span>
                    <Avatar className="h-8 w-8 border">
                      <AvatarImage src={profileImg} alt={displayName} />
                      <AvatarFallback>{fallbackAvatar}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium truncate max-w-[100px] text-sm">{displayName}</span>
                  </div>
                  <div className="text-sm font-semibold text-primary">{user.referrals || 0}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default LeaderboardSection;
