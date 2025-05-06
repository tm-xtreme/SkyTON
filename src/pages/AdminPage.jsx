
import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import UserManagementTab from '@/components/admin/UserManagementTab';
import TaskManagementTab from '@/components/admin/TaskManagementTab';
import PendingVerificationTab from '@/components/admin/PendingVerificationTab';
import { UserContext } from '@/App'; // Import UserContext
import { Loader2, Users, ListChecks, CheckSquare } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const AdminPage = () => {
  const { user } = useContext(UserContext); // Get current user from context

  // Redirect or show message if not admin - handled by App.jsx routing now
  // if (!user || !user.isAdmin) {
  //    return <div className="text-center text-destructive">Access Denied. Admins only.</div>;
  // }

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Card>
          <CardHeader>
             <CardTitle className="text-2xl">Admin Panel</CardTitle>
             <CardDescription>Manage users, tasks, and settings.</CardDescription>
          </CardHeader>
          <CardContent>
             <Tabs defaultValue="users" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                   <TabsTrigger value="users">
                     <Users className="mr-2 h-4 w-4" /> Users
                    </TabsTrigger>
                   <TabsTrigger value="tasks">
                     <ListChecks className="mr-2 h-4 w-4" /> Tasks
                    </TabsTrigger>
                    <TabsTrigger value="pending">
                     <CheckSquare className="mr-2 h-4 w-4" /> Pending
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="users" className="mt-4">
                   <UserManagementTab />
                </TabsContent>
                <TabsContent value="tasks" className="mt-4">
                    <TaskManagementTab />
                </TabsContent>
                 <TabsContent value="pending" className="mt-4">
                    <PendingVerificationTab />
                 </TabsContent>
             </Tabs>
          </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminPage;
  