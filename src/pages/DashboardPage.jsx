import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import ProfileSection from '@/components/dashboard/ProfileSection';
import TasksSection from '@/components/dashboard/TasksSection';
import ReferralSection from '@/components/dashboard/ReferralSection';
import LeaderboardSection from '@/components/dashboard/LeaderboardSection';
import { getAllTasks } from '@/data';
import { UserContext } from '@/App';
import { Loader2 } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const DashboardPage = ({ activeView }) => {
  const { user, setUser } = useContext(UserContext);
  const [tasks, setTasks] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoadingTasks(true);
      const fetchedTasks = await getAllTasks();
      setTasks(fetchedTasks || []);
      setIsLoadingTasks(false);
    };

    fetchTasks();
  }, []);

  const refreshUserData = (updatedUser) => {
    setUser(updatedUser);
  };

  const renderSection = () => {
    switch (activeView) {
      case 'home':
        return <ProfileSection user={user} refreshUserData={refreshUserData} />;
      case 'tasks':
        return isLoadingTasks ? (
          <div className="flex justify-center items-center h-full py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <TasksSection tasks={tasks} user={user} refreshUserData={refreshUserData} />
        );
      case 'invite':
        return <ReferralSection user={user} />;
      case 'leaders':
        return <LeaderboardSection currentUserTelegramId={user?.id} />;
      default:
        return <ProfileSection user={user} refreshUserData={refreshUserData} />;
    }
  };

  return (
    <motion.div
      className="w-full min-h-screen bg-background dark:bg-gray-900 overflow-y-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {renderSection()}
    </motion.div>
  );
};

export default DashboardPage;
