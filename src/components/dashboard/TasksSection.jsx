
import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { completeTask, performCheckIn, requestManualVerification, getCurrentUser, isCheckInDoneToday } from '@/data'; // Use Firestore functions, changed getUser to getCurrentUser
import { UserContext } from '@/App'; // Import UserContext
import { CheckCircle, Link as LinkIcon, LogIn, UserPlus, CalendarCheck, HelpCircle, Clock } from 'lucide-react';

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

// Added refreshUserData (setUser from context)
const TasksSection = ({ tasks = [], user, refreshUserData }) => {
  const { toast } = useToast();

  const handleVerificationClick = async (task) => {
     if (!user?.id || !task?.id) return; // Use user.id (Firestore document ID)

     // Check if task is already completed or pending from user object
     const isCompleted = user.tasks?.[task.id] === true;
     const isPending = user.pendingVerificationTasks?.includes(task.id);

     if (isCompleted || isPending) return; // Already done or pending

     let success = false;
     let toastMessage = {};

     if (task.type === 'telegram_join' || task.type === 'visit_site') { // Assume these can be auto-verified for now
         if (task.verificationType === 'auto') {
             console.log(`Simulating automatic verification for: ${task.target || task.title}`);
             success = await completeTask(user.id, task.id); // Use user.id
             if(success) {
                 toastMessage = { title: "Task Verified!", description: `You earned ${task.reward} STON!`, variant: "success"};
             } else {
                 toastMessage = { title: "Verification Failed", description: "Could not verify task completion.", variant: "destructive"};
             }
         } else { // Manual verification requested
             success = await requestManualVerification(user.id, task.id); // Use user.id
             if(success) {
                 toastMessage = { title: "Verification Requested", description: `Task "${task.title}" sent for manual review.`, variant: "default"};
             } else {
                 toastMessage = { title: "Request Failed", description: "Could not request verification.", variant: "destructive"};
             }
         }
     } else if (task.type === 'twitter_follow') { // Example: Twitter always manual for now
         success = await requestManualVerification(user.id, task.id); // Use user.id
          if(success) {
             toastMessage = { title: "Verification Requested", description: `Task "${task.title}" sent for manual review.`, variant: "default"};
         } else {
             toastMessage = { title: "Request Failed", description: "Could not request verification.", variant: "destructive"};
         }
     }
     // Other task types (like 'referral') might not have a button or have different logic

     // If action was successful, refresh user data in context
     if (success) {
        const updatedUser = await getCurrentUser(user.id); // Use getCurrentUser and user.id
        if (updatedUser) refreshUserData(updatedUser);
        toast(toastMessage);
     } else if (toastMessage.title) { // Show error toast if action failed
         toast(toastMessage);
     }
   };


   const handleCheckIn = async () => {
    if (!user?.id) return; // Use user.id

    const result = await performCheckIn(user.id); // Use user.id

    if (result.success) {
        const updatedUser = await getCurrentUser(user.id); // Refresh user data using user.id
        if (updatedUser) refreshUserData(updatedUser);
        toast({
            title: "Daily Check-in Successful!",
            description: `You earned ${result.reward} STON!`,
            variant: "success",
        });
    } else {
        toast({
            title: result.message || "Check-in Failed",
            description: result.message === 'Already checked in today.' ? "Come back tomorrow!" : "Please try again.",
            variant: "default",
        });
    }
  };

   // Use the helper function with the user's lastCheckIn timestamp
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
            {tasks.filter(task => task.active).map((task) => {
              const isCompleted = user.tasks?.[task.id] === true;
              const isPending = user.pendingVerificationTasks?.includes(task.id);
              const checkInTaskDone = task.type === 'daily_checkin' && checkInDone;

              // Determine if the button should be disabled
              const isDisabled = isCompleted || isPending || checkInTaskDone;

              return (
                <div key={task.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <div className="flex-1 mr-2">
                    <p className="font-semibold">{task.title} (+{task.reward} STON)</p>
                    <p className="text-xs text-muted-foreground">{task.description}</p>
                    {task.target && (
                      <a
                        href={task.type === 'telegram_join' || task.type === 'twitter_follow' ? `https://t.me/${task.target.replace('@','')}` : task.target}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 break-all hover:underline"
                       >
                         {task.target}
                      </a>
                     )}
                  </div>

                  <div className="flex-shrink-0">
                   {isCompleted ? (
                       <Badge variant="success" className="flex items-center gap-1 cursor-default">
                         <CheckCircle className="h-3 w-3" /> Done
                       </Badge>
                   ) : isPending ? (
                       <Badge variant="warning" className="flex items-center gap-1 cursor-default">
                         <Clock className="h-3 w-3" /> Pending
                       </Badge>
                   ) : task.type === 'daily_checkin' ? (
                     <Button size="sm" onClick={handleCheckIn} disabled={isDisabled}>
                       <CalendarCheck className="mr-2 h-4 w-4" /> {isDisabled ? 'Checked In' : 'Check In'}
                     </Button>
                   ) : task.type === 'referral' ? (
                     <Badge variant="outline" className="cursor-default">Via Invites</Badge>
                   ) : ( // Other task types like telegram_join, twitter_follow, visit_site
                     <Button size="sm" onClick={() => handleVerificationClick(task)} disabled={isDisabled}>
                       {task.verificationType === 'auto' ? <CheckCircle className="mr-2 h-4 w-4" /> : <HelpCircle className="mr-2 h-4 w-4" />}
                       {task.verificationType === 'auto' ? 'Verify Task' : 'Request Verify'}
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
  