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
  const [verifying, setVerifying] = useState({}); // For disabling verify/request buttons

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
      toast({ title: 'Daily Check-in Successful!', description: `+${result.reward} STON`, variant: 'success', className: "bg-[#1a1a1a] text-white" });
    } else {
      toast({ title: 'Check-in Failed', description: result.message || 'Try again later.', variant: 'destructive', className: "bg-[#1a1a1a] text-white" });
    }
    setVerifying(v => ({ ...v, checkin: false }));
  };

  // Helper function to send messages to admin
  const sendAdminNotification = async (message) => {
    try {
      await fetch(`https://api.telegram.org/bot${import.meta.env.VITE_TG_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: '5063003944', // Admin chat ID
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

    // Telegram join + auto verify
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
              // Send success notification to admin
              const userMention = user.username ? `@${user.username}` : `User ${user.id}`;
              await sendAdminNotification(`✅ <b>Auto-Verification Success</b>\n${userMention} successfully joined <b>${task.title}</b> (${task.target})\nReward: +${task.reward} STON`);
              
              const updatedUser = await getCurrentUser(user.id);
              if (updatedUser) refreshUserData(updatedUser);
              toast({ title: 'Joined Verified', description: `+${task.reward} STON`, variant: 'success' });
              setVerifying(v => ({ ...v, [task.id]: false }));
              return;
            }
          } else {
            toast({ title: 'Not Verified', description: 'Please join the channel first.', variant: 'destructive' });
            setClickedTasks(prev => ({ ...prev, [task.id]: false }));
            setVerifying(v => ({ ...v, [task.id]: false }));
            return;
          }
        } else if (data.error_code === 400 || data.error_code === 403) {
          await sendAdminNotification(`❗ <b>Bot Error</b>\nBot is not an admin or failed to access @${task.target}. Please ensure it's added correctly.`);
          toast({ title: 'Bot Error', description: 'Bot is not admin in the group/channel. Contact support.', variant: 'destructive' });
          setVerifying(v => ({ ...v, [task.id]: false }));
          return;
        } else {
          toast({ title: 'Telegram Error', description: 'Failed to verify. Try again.', variant: 'destructive' });
          setClickedTasks(prev => ({ ...prev, [task.id]: false }));
          setVerifying(v => ({ ...v, [task.id]: false }));
          return;
        }
      } catch (err) {
        toast({ title: 'Network Error', description: 'Could not reach Telegram servers.', variant: 'destructive' });
        setClickedTasks(prev => ({ ...prev, [task.id]: false }));
        setVerifying(v => ({ ...v, [task.id]: false }));
        return;
      }
    }

    // Normal auto/manual verify
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
      // In TasksSection.jsx
      success = await requestManualVerification(user.id, task.id);

      if (success) {
        const userMention = user.username ? `@${user.username}` : `User ${user.id}`;
        await sendAdminNotification(`🔍 <b>Manual Verification Request</b>\n${userMention} requested verification for <b>${task.title}</b>\nTarget: ${task.target || 'N/A'}\nReward: ${task.reward} STON`);
      }
      toast({
        title: success ? 'Verification Requested' : 'Request Failed',
        description: success ? `"${task.title}" sent for review.` : 'Try again later.',
        variant: success ? 'default' : 'destructive'
      });
    }

    if (success) {
      const updatedUser = await getCurrentUser(user.id);
      if (updatedUser) refreshUserData(updatedUser);
    }
    setVerifying(v => ({ ...v, [task.id]: false }));
  };

  return (
    <motion.div variants={itemVariants} className="w-full min-h-[100dvh] text-white px-4 pb-28 pt-6 bg-[#0f0f0f] overflow-y-auto">
      <div className="max-w-md mx-auto space-y-5">
        <h2 className="text-center text-lg font-bold text-white mb-2">Available Tasks</h2>

        <div className="bg-gradient-to-r from-sky-700 to-sky-900 p-4 rounded-xl flex items-center justify-between shadow">
          <div>
            <p className="text-sm text-white font-semibold">Play Game</p>
            <p className="text-xs text-gray-300">Catch STON gems and earn rewards!</p>
          </div>
          <Button size="sm" onClick={handlePlayGame}>
            <Gamepad2 className="mr-1 w-4 h-4" /> Play
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center pt-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          tasks.filter(t => t.active).map(task => {
            const isCheckInTask = task.type === 'daily_checkin';
            const isCompleted = isCheckInTask ? checkInDone : user?.tasks?.[task.id] === true;
            const isPending = user?.pendingVerificationTasks?.includes(task.id);
            const targetUrl = task.type.includes('telegram')
              ? `https://t.me/${(task.target || '').replace('@', '')}`
              : (task.target || '#');
            const hasClicked = clickedTasks[task.id];

            return (
              <div key={task.id} className="bg-white/5 p-4 rounded-xl space-y-2 shadow-md">
                <div className="flex flex-col">
                  <p className="text-sm font-semibold text-white">{task.title || 'Untitled Task'}</p>
                  <a
                    href={targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline"
                  >
                    {task.description || 'No description provided.'}
                  </a>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-green-400 font-semibold">+{task.reward || 0} STON</p>

                  {isCompleted ? (
                    <Badge variant="success" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" /> Done
                    </Badge>
                  ) : isPending ? (
                    <Badge variant="warning" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" /> Pending
                    </Badge>
                  ) : isCheckInTask ? (
                    <Button
                      size="sm"
                      onClick={handleCheckIn}
                      disabled={isCompleted || verifying.checkin}
                    >
                      {verifying.checkin ? (
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      ) : (
                        <CalendarCheck className="mr-1 h-4 w-4" />
                      )}
                      {checkInDone ? 'Checked In' : 'Check In'}
                    </Button>
                  ) : task.type === 'referral' ? (
                    <Badge variant="outline" className="text-white border-gray-300">Via Invites</Badge>
                  ) : !hasClicked ? (
                    <Button size="sm" onClick={() => handleGoToTask(task.id, targetUrl)}>
                      Go <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleVerificationClick(task)}
                      disabled={verifying[task.id]}
                    >
                      {verifying[task.id] ? (
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      ) : task.verificationType === 'auto' ? (
                        <><CheckCircle className="mr-1 h-4 w-4" /> Verify</>
                      ) : (
                        <><HelpCircle className="mr-1 h-4 w-4" /> Request</>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

export default TasksSection;
    
