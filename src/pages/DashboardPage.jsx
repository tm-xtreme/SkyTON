
import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import ProfileSection from '@/components/dashboard/ProfileSection';
import TasksSection from '@/components/dashboard/TasksSection';
import ReferralSection from '@/components/dashboard/ReferralSection';
import LeaderboardSection from '@/components/dashboard/LeaderboardSection';
import { getAllTasks } from '@/data'; // Use Firestore function
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

// Accepts activeView prop to conditionally render sections
const DashboardPage = ({ activeView }) => {
  const { user, setUser } = useContext(UserContext); // Get user and setUser from context
  const [tasks, setTasks] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]); // Added state for leaderboard
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  // const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true); // Add loading state if needed for leaderboard

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoadingTasks(true);
      const fetchedTasks = await getAllTasks();
      setTasks(fetchedTasks || []);
      setIsLoadingTasks(false);
    };

    // Fetch leaderboard data (replace with actual function when available)
    // const fetchLeaderboard = async () => {
    //   setIsLoadingLeaderboard(true);
    //   const data = await getLeaderboardData(); // Assuming a function exists
    //   setLeaderboard(data || []);
    //   setIsLoadingLeaderboard(false);
    // };

    fetchTasks();
    // fetchLeaderboard(); // Call leaderboard fetch function
  }, []); // Fetch on mount

  // refreshUserData function to update context
  const refreshUserData = (updatedUser) => {
    setUser(updatedUser);
  };

  // Conditional rendering based on activeView
  const renderSection = () => {
    switch(activeView) {
      case 'home':
        return <ProfileSection user={user} refreshUserData={refreshUserData} />;
      case 'tasks':
        return isLoadingTasks ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <TasksSection tasks={tasks} user={user} refreshUserData={refreshUserData} />
        );
      case 'invite':
        return <ReferralSection user={user} />;
      case 'leaders':
         return <LeaderboardSection currentUserTelegramId={user?.id} />; // Pass current user ID
        // return isLoadingLeaderboard ? (
        //   <div className="flex justify-center items-center p-8">
        //     <Loader2 className="h-8 w-8 animate-spin text-primary" />
        //   </div>
        // ) : (
        //   <LeaderboardSection leaderboard={leaderboard} currentUser={user} />
        // );
      default:
        return <ProfileSection user={user} refreshUserData={refreshUserData} />; // Default to profile/home
    }
  }

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
       {/* Render the section determined by activeView */}
       {renderSection()}

      {/*
      Keeping these commented out as they are now conditionally rendered above

      <ProfileSection user={user} refreshUserData={refreshUserData} />

      {isLoadingTasks ? (
         <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
         </div>
       ) : (
         <TasksSection tasks={tasks} user={user} refreshUserData={refreshUserData} />
      )}

       <ReferralSection user={user} />

       <LeaderboardSection currentUserTelegramId={user?.id} />
      */}

    </motion.div>
  );
};

export default DashboardPage;
  