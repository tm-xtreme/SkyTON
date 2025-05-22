import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  completeTask,
  performCheckIn,
  requestManualVerification,
  getCurrentUser,
  isCheckInDoneToday
} from '@/data';
import {
  CheckCircle, CalendarCheck, HelpCircle, Clock, Gamepad2, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

const TasksSection = ({ tasks = [], user, refreshUserData }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [clickedTasks, setClickedTasks] = useState({});

  const handleVerificationClick = async (task) => {
    if (!user?.id || !task?.id) return;

    const isCompleted = user.tasks?.[task.id] === true;
    const isPending = user.pendingVerificationTasks?.includes(task.id);
    if (isCompleted || isPending) return;

    let success = false;
    let toastMessage = {};

    if (task.verificationType === 'auto') {
      success = await completeTask(user.id, task.id);
      toastMessage = success
        ? { title: "Task Verified!", description: `You earned ${task.reward} STON!`, variant: "success" }
        : { title: "Verification Failed", description: "Could not verify task completion.", variant: "destructive" };
    } else {
      success = await requestManualVerification(user.id, task.id);
      toastMessage = success
        ? { title: "Verification Requested", description: `\"${task.title}\" sent for review.`, variant: "default" }
        : { title: "Request Failed", description: "Try again later.", variant: "destructive" };
    }

    if (success) {
      const updatedUser = await getCurrentUser(user.id);
      if (updatedUser) refreshUserData(updatedUser);
    }

    toast(toastMessage);
  };

  const handleCheckIn = async () => {
    if (!user?.id) return;
    const result = await performCheckIn(user.id);
    if (result.success) {
      const updatedUser = await getCurrentUser(user.id);
      if (updatedUser) refreshUserData(updatedUser);
      toast({
        title: "Daily Check-in Successful!",
        description: `You earned ${result.reward} STON!`,
        variant: "success"
      });
    } else {
      toast({
        title: "Check-in Failed",
        description: result.message || "Try again later.",
        variant: "default"
      });
    }
  };

  const checkInDone = isCheckInDoneToday(user.lastCheckIn);

  const handlePlayGame = () => {
    if (user?.id) {
      sessionStorage.setItem('gameUserId', user.id);
      navigate('/game');
    }
  };

  const handleGoToTask = (taskId, url) => {
    window.open(url, '_blank');
    setClickedTasks((prev) => ({ ...prev, [taskId]: true }));
  };

  return (
    <motion.div variants={itemVariants} className="w-full h-[100dvh] text-white px-4 pb-28 pt-6 bg-[#0f0f0f]">
      <div className="max-w-md mx-auto space-y-5">
        <div className="bg-gradient-to-r from-sky-700 to-sky-900 p-4 rounded-xl flex items-center justify-between shadow">
          <div>
            <p className="text-sm text-white font-semibold">Play Game</p>
            <p className="text-xs text-gray-300">Catch STON gems and earn rewards!</p>
          </div>
          <Button size="sm" onClick={handlePlayGame}>
            <Gamepad2 className="mr-1 w-4 h-4" /> Play
          </Button>
        </div>

        {tasks.filter(t => t.active).map((task) => {
          const isCheckInTask = task.type === 'daily_checkin';
          const isCompleted = isCheckInTask
            ? checkInDone
            : user.tasks?.[task.id] === true;
          const isPending = user.pendingVerificationTasks?.includes(task.id);
          const isDisabled = isCheckInTask ? checkInDone : (isCompleted || isPending);

          const targetUrl = task.type.includes('telegram')
            ? `https://t.me/${task.target.replace('@', '')}`
            : task.target;

          const hasClicked = clickedTasks[task.id];

          return (
            <div key={task.id} className="bg-white/5 p-4 rounded-xl space-y-2 shadow-md">
              <div className="flex flex-col">
                <p className="text-sm font-semibold text-white">{task.title}</p>
                <p className="text-xs text-gray-400">{task.description}</p>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-green-400 font-semibold">+{task.reward} STON</p>

                {isCompleted ? (
                  <Badge variant="success" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" /> Done
                  </Badge>
                ) : isPending ? (
                  <Badge variant="warning" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" /> Pending
                  </Badge>
                ) : isCheckInTask ? (
                  <Button size="sm" onClick={handleCheckIn} disabled={isDisabled}>
                    <CalendarCheck className="mr-1 h-4 w-4" /> {checkInDone ? "Checked In" : "Check In"}
                  </Button>
                ) : task.type === 'referral' ? (
                  <Badge variant="outline">Via Invites</Badge>
                ) : !hasClicked ? (
                  <Button
                    size="sm"
                    onClick={() => handleGoToTask(task.id, targetUrl)}
                  >
                    Go <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleVerificationClick(task)}
                    disabled={isDisabled}
                  >
                    {task.verificationType === 'auto' ? (
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
          );
        })}
      </div>
    </motion.div>
  );
};

export default TasksSection;
