import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, CalendarCheck, HelpCircle, Clock, Gamepad2, ArrowRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  completeTask,
  performCheckIn,
  requestManualVerification,
  getCurrentUser,
  isCheckInDoneToday
} from '@/data';
import { useNavigate } from 'react-router-dom';

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

const TasksSection = ({ tasks = [], user = {}, refreshUserData, isLoading }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [clickedTasks, setClickedTasks] = useState({});
  const [verifying, setVerifying] = useState({});

  const checkInDone = isCheckInDoneToday(user?.lastCheckIn);

  const handlePlayGame = () => {
    if (user?.id) {
      sessionStorage.setItem('gameUserId', user.id);
      navigate('/game');
    }
  };

  const handleGoToTask = (taskId, url) => {
    window.open(url, '_blank');
    setClickedTasks(prev => ({ ...prev, [taskId]: true }));
  };

  const handleCheckIn = async () => {
    if (!user?.id) return;
    setVerifying(v => ({ ...v, checkin: true }));
    const result = await performCheckIn(user.id);
    if (result.success) {
      const updatedUser = await getCurrentUser(user.id);
      if (updatedUser) refreshUserData(updatedUser);
      toast({ 
        title: 'Daily Check-in Successful!', 
        description: `+${result.reward} STON`, 
        variant: 'success', 
        className: "bg-[#1a1a1a] text-white" 
      });
    } else {
      toast({ 
        title: 'Check-in Failed', 
        description: result.message || 'Try again later.', 
        variant: 'destructive', 
        className: "bg-[#1a1a1a] text-white" 
      });
    }
    setVerifying(v => ({ ...v, checkin: false }));
  };

  const sendAdminNotification = async (message) => {
    try {
      await fetch(`https://api.telegram.org/bot${import.meta.env.VITE_TG_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: '5063003944',
          text: message,
          parse_mode: 'HTML'
        })
      });
    } catch (err) {
      console.error("Failed to send admin notification:", err);
    }
  };

  const handleVerificationClick = async (task) => {
    if (!user?.id || !task?.id) return;

    setVerifying(v => ({ ...v, [task.id]: true }));

    const isCompleted = user.tasks?.[task.id] === true;
    const isPending = user.pendingVerificationTasks?.includes(task.id);
    if (isCompleted || isPending) {
      setVerifying(v => ({ ...v, [task.id]: false }));
      return;
    }

    if (task.verificationType === 'auto' && task.type === 'telegram_join') {
      try {
        const apiUrl = `https://api.telegram.org/bot${import.meta.env.VITE_TG_BOT_TOKEN}/getChatMember?chat_id=@${task.target.replace('@', '')}&user_id=${user.id}`;
        const res = await fetch(apiUrl);
        const data = await res.json();

        if (data.ok) {
          const status = data.result.status;
          if (['member', 'administrator', 'creator'].includes(status)) {
            const verified = await completeTask(user.id, task.id);
            if (verified) {
              const userMention = user.username ? `@${user.username}` : `User ${user.id}`;
              await sendAdminNotification(`✅ <b>Auto-Verification Success</b>\n${userMention} successfully joined <b>${task.title}</b> (${task.target})\nReward: +${task.reward} STON`);
              
              const updatedUser = await getCurrentUser(user.id);
              if (updatedUser) refreshUserData(updatedUser);
              toast({ 
                title: 'Joined Verified', 
                description: `+${task.reward} STON`, 
                variant: 'success', 
                className: "bg-[#1a1a1a] text-white" 
              });
              setVerifying(v => ({ ...v, [task.id]: false }));
              return;
            }
          } else {
            toast({ 
              title: 'Not Verified', 
              description: 'Please join the channel first.', 
              variant: 'destructive', 
              className: "bg-[#1a1a1a] text-white" 
            });
            setClickedTasks(prev => ({ ...prev, [task.id]: false }));
            setVerifying(v => ({ ...v, [task.id]: false }));
            return;
          }
        } else if (data.error_code === 400 || data.error_code === 403) {
          await sendAdminNotification(`❗ <b>Bot Error</b>\nBot is not an admin or failed to access @${task.target}. Please ensure it's added correctly.`);
          toast({ 
            title: 'Bot Error', 
            description: 'Something Went Wrong, Please Wait and Try Again Later...', 
            variant: 'destructive', 
            className: "bg-[#1a1a1a] text-white" 
          });
          setVerifying(v => ({ ...v, [task.id]: false }));
          return;
        } else {
          toast({ 
            title: 'Telegram Error', 
            description: 'Failed to verify. Try again.', 
            variant: 'destructive', 
            className: "bg-[#1a1a1a] text-white" 
          });
          setClickedTasks(prev => ({ ...prev, [task.id]: false }));
          setVerifying(v => ({ ...v, [task.id]: false }));
          return;
        }
      } catch (err) {
        toast({ 
          title: 'Network Error', 
          description: 'Could not reach Telegram servers.', 
          variant: 'destructive', 
          className: "bg-[#1a1a1a] text-white" 
        });
        setClickedTasks(prev => ({ ...prev, [task.id]: false }));
        setVerifying(v => ({ ...v, [task.id]: false }));
        return;
      }
    }

    let success = false;
    if (task.verificationType === 'auto') {
      success = await completeTask(user.id, task.id);
      if (success) {
        const userMention = user.username ? `@${user.username}` : `User ${user.id}`;
        await sendAdminNotification(`✅ <b>Auto-Verification Success</b>\n${userMention} completed <b>${task.title}</b>\nReward: +${task.reward} STON`);
      }
      toast({
        title: success ? 'Task Verified!' : 'Verification Failed',
        description: success ? `+${task.reward} STON` : 'Could not verify task completion.',
        variant: success ? 'success' : 'destructive',
        className: "bg-[#1a1a1a] text-white"
      });
    } else {
      success = await requestManualVerification(user.id, task.id);

      if (success) {
        const userMention = user.username ? `@${user.username}` : `User ${user.id}`;
        await sendAdminNotification(`🔍 <b>Manual Verification Request</b>\n${userMention} requested verification for <b>${task.title}</b>\nTarget: ${task.target || 'N/A'}\nReward: ${task.reward} STON`);
      }
      toast({
        title: success ? 'Verification Requested' : 'Request Failed',
        description: success ? `"${task.title}" sent for review.` : 'Try again later.',
        variant: success ? 'success' : 'destructive',
        className: "bg-[#1a1a1a] text-white"
      });
    }

    if (success) {
      const updatedUser = await getCurrentUser(user.id);
      if (updatedUser) refreshUserData(updatedUser);
    }
    setVerifying(v => ({ ...v, [task.id]: false }));
  };

  return (
    <div
      className="relative w-full min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#1a1a1a] text-white overflow-y-auto"
      style={{
        touchAction: "pan-y",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
      }}
    >
      <div className="flex flex-col items-center px-4 py-4 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md flex flex-col items-center gap-4"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <h2 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Available Tasks
            </h2>
            <p className="text-xs text-gray-400 mt-1">Complete tasks to earn STON rewards</p>
          </motion.div>

          {/* Play Game Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full"
          >
            <div className="bg-gradient-to-r from-sky-600/20 to-sky-800/20 backdrop-blur-sm border border-sky-500/30 p-3 rounded-2xl flex items-center justify-between shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center gap-3">
                <div className="bg-sky-500/20 p-2 rounded-xl">
                  <Gamepad2 className="h-5 w-5 text-sky-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Play Game</p>
                  <p className="text-xs text-gray-300">Catch STON gems and earn rewards!</p>
                </div>
              </div>
              <Button 
                size="sm" 
                onClick={handlePlayGame}
                className="h-8 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl"
              >
                <Gamepad2 className="mr-1 w-4 h-4" /> Play
              </Button>
            </div>
          </motion.div>

          {/* Tasks List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full space-y-3"
          >
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-gray-400 text-sm">Loading tasks...</span>
              </div>
            ) : (
              tasks.filter(t => t.active).map((task, index) => {
                const isCheckInTask = task.type === 'daily_checkin';
                const isCompleted = isCheckInTask ? checkInDone : user?.tasks?.[task.id] === true;
                const isPending = user?.pendingVerificationTasks?.includes(task.id);
                const targetUrl = task.type.includes('telegram')
                  ? `https://t.me/${(task.target || '').replace('@', '')}`
                  : (task.target || '#');
                const hasClicked = clickedTasks[task.id];

                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-600/50 p-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-white truncate">
                            {task.title || 'Untitled Task'}
                          </p>
                          <Badge className="bg-green-600/20 text-green-300 border-green-600 text-xs px-2 py-0.5">
                            +{task.reward || 0} STON
                          </Badge>
                        </div>
                        <a
                          href={targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:underline block truncate"
                        >
                          {task.description || 'No description provided.'}
                        </a>
                      </div>

                      <div className="ml-3 flex-shrink-0">
                        {isCompleted ? (
                          <Badge className="bg-green-600/20 text-green-300 border-green-600 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" /> Done
                          </Badge>
                        ) : isPending ? (
                          <Badge className="bg-yellow-600/20 text-yellow-300 border-yellow-600 text-xs">
                            <Clock className="h-3 w-3 mr-1" /> Pending
                          </Badge>
                        ) : isCheckInTask ? (
                          <Button
                            size="sm"
                            onClick={handleCheckIn}
                            disabled={isCompleted || verifying.checkin}
                            className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                          >
                            {verifying.checkin ? (
                              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                            ) : (
                              <CalendarCheck className="mr-1 h-4 w-4" />
                            )}
                            {checkInDone ? 'Checked In' : 'Check In'}
                          </Button>
                        ) : task.type === 'referral' ? (
                          <Badge className="bg-purple-600/20 text-purple-300 border-purple-600 text-xs">
                            Via Invites
                          </Badge>
                        ) : !hasClicked ? (
                          <Button 
                            size="sm" 
                            onClick={() => handleGoToTask(task.id, targetUrl)}
                            className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                          >
                            Go <ArrowRight className="ml-1 h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleVerificationClick(task)}
                            disabled={verifying[task.id]}
                            className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white rounded-xl disabled:opacity-50"
                          >
                            {verifying[task.id] ? (
                              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                            ) : task.verificationType === 'auto' ? (
                              <>
                                <CheckCircle className="mr-1 h-4 w-4" /> Verify
                              </>
                            ) : (
                              <>
                                <HelpCircle className="mr-1 h-4 w-4" /> Request
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}

            {/* Empty State */}
            {!isLoading && tasks.filter(t => t.active).length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center py-8"
              >
                <div className="bg-gray-800/50 border border-gray-600/50 rounded-2xl p-6">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 text-sm">No tasks available</p>
                  <p className="text-gray-500 text-xs mt-2">
                    Check back later for new tasks
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Stats Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="w-full"
          >
            <div className="bg-gradient-to-r from-purple-600/20 to-purple-800/20 backdrop-blur-sm border border-purple-500/30 p-3 rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  <p className="text-xs text-gray-300">Completed</p>
                  <p className="text-lg font-bold text-white">
                    {user.tasks ? Object.values(user.tasks).filter(Boolean).length : 0}
                  </p>
                </div>
                <div className="w-px h-8 bg-purple-500/30"></div>
                <div className="text-center flex-1">
                  <p className="text-xs text-gray-300">Available</p>
                  <p className="text-lg font-bold text-white">
                    {tasks.filter(t => t.active && !user?.tasks?.[t.id]).length}
                  </p>
                </div>
                <div className="w-px h-8 bg-purple-500/30"></div>
                <div className="text-center flex-1">
                  <p className="text-xs text-gray-300">Pending</p>
                  <p className="text-lg font-bold text-white">
                    {user?.pendingVerificationTasks?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Daily Check-in Streak */}
          {user?.checkInStreak && user.checkInStreak > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="w-full"
            >
              <div className="bg-gradient-to-r from-orange-600/20 to-orange-800/20 backdrop-blur-sm border border-orange-500/30 p-3 rounded-2xl text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <CalendarCheck className="h-5 w-5 text-orange-400" />
                  <p className="text-sm font-semibold text-white">Check-in Streak</p>
                </div>
                <p className="text-2xl font-bold text-orange-400">
                  {user.checkInStreak} {user.checkInStreak === 1 ? 'day' : 'days'}
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  Keep it up! Daily check-ins earn bonus rewards
                </p>
              </div>
            </motion.div>
          )}

          {/* Tips Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="w-full"
          >
            <div className="bg-gradient-to-r from-blue-600/10 to-blue-800/10 backdrop-blur-sm border border-blue-500/20 p-3 rounded-2xl">
              <h3 className="text-sm font-semibold text-blue-400 mb-2 text-center">
                💡 Tips
              </h3>
              <div className="space-y-2 text-xs text-gray-300">
                <p>• Complete daily check-ins to build your streak</p>
                <p>• Join Telegram channels for instant verification</p>
                <p>• Manual tasks are reviewed by admins within 24 hours</p>
                <p>• Play the game daily for extra STON rewards</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default TasksSection;
