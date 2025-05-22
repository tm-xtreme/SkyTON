import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import ProfileSection from '@/components/dashboard/ProfileSection';
import TasksSection from '@/components/dashboard/TasksSection';
import ReferralSection from '@/components/dashboard/ReferralSection';
import LeaderboardSection from '@/components/dashboard/LeaderboardSection';
import { getAllTasks } from '@/data';
import { UserContext } from '@/App';

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

  return (
    <motion.div
      className="w-full min-h-screen bg-background dark:bg-gray-900 overflow-y-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {activeView === 'home' && <ProfileSection user={user} refreshUserData={refreshUserData} />}
      {activeView === 'invite' && <ReferralSection user={user} />}
      {activeView === 'leaders' && <LeaderboardSection currentUserTelegramId={user?.id} />}
      {activeView === 'tasks' && (
        <TasksSection
          user={user}
          tasks={tasks}
          isLoading={isLoadingTasks}
          refreshUserData={refreshUserData}
        />
      )}
    </motion.div>
  );
};

export default DashboardPage;
