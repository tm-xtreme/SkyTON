import React from 'react';
import { motion } from 'framer-motion';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/components/ui/card';
import {
  Button
} from '@/components/ui/button';
import {
  Badge
} from '@/components/ui/badge';
import {
  useToast
} from '@/components/ui/use-toast';
import {
  completeTask,
  performCheckIn,
  requestManualVerification,
  getCurrentUser,
  isCheckInDoneToday
} from '@/data';
import { CheckCircle, Link as LinkIcon, LogIn, UserPlus, CalendarCheck, HelpCircle, Clock } from 'lucide-react';

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

const TasksSection = ({ tasks = [], user, refreshUserData }) => {
  const { toast } = useToast();

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
        ? { title: "Verification Requested", description: `"${task.title}" sent for review.`, variant: "default" }
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

  return (
    <motion.div variants={itemVariants}>
      <Card>
        <CardHeader>
          <CardTitle>Available Tasks</CardTitle>
          <CardDescription>Complete tasks to earn more STON.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasks.filter(t => t.active).map((task) => {
              const isCompleted = user.tasks?.[task.id] === true;
              const isPending = user.pendingVerificationTasks?.includes(task.id);
              const isCheckInTask = task.type === 'daily_checkin';
              const isDisabled = isCheckInTask ? checkInDone : (isCompleted || isPending);

              return (
                <div key={task.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <div className="flex-1 mr-2">
                    <p className="font-semibold">{task.title} (+{task.reward} STON)</p>
                    <p className="text-xs text-muted-foreground">{task.description}</p>
                    {task.target && (
                      <a
                        href={task.type.includes('telegram') ? `https://t.me/${task.target.replace('@', '')}` : task.target}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline"
                      >
                        {task.target}
                      </a>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    {isCompleted ? (
                      <Badge variant="success" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Done
                      </Badge>
                    ) : isPending ? (
                      <Badge variant="warning" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Pending
                      </Badge>
                    ) : isCheckInTask ? (
                      <Button size="sm" onClick={handleCheckIn} disabled={isDisabled}>
                        <CalendarCheck className="mr-2 h-4 w-4" /> {checkInDone ? "Checked In" : "Check In"}
                      </Button>
                    ) : task.type === 'referral' ? (
                      <Badge variant="outline">Via Invites</Badge>
                    ) : (
                      <Button size="sm" onClick={() => handleVerificationClick(task)} disabled={isDisabled}>
                        {task.verificationType === 'auto' ? (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" /> Verify
                          </>
                        ) : (
                          <>
                            <HelpCircle className="mr-2 h-4 w-4" /> Request Verify
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TasksSection;
