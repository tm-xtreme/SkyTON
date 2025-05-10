import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import UserManagementTab from '@/components/admin/UserManagementTab';
import TaskManagementTab from '@/components/admin/TaskManagementTab';
import PendingVerificationTab from '@/components/admin/PendingVerificationTab';
import { UserContext } from '@/App';
import { getAllUsers, toggleUserBanStatus } from '@/data/firestore/userActions';
import { getAllTasks, createTask, updateTask, deleteTask } from '@/data/firestore/taskActions';
import { Loader2, Users, ListChecks, CheckSquare } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const AdminPage = () => {
  const { user } = useContext(UserContext);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: '', description: '', reward: 0, active: true, type: '', verificationType: 'auto' });
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      const userList = await getAllUsers();
      setUsers(userList || []);
      setLoadingUsers(false);
    };

    const fetchTasks = async () => {
      const taskList = await getAllTasks();
      setTasks(taskList || []);
    };

    fetchUsers();
    fetchTasks();
  }, []);

  const handleBanToggle = async (telegramId, currentStatus) => {
    const updated = await toggleUserBanStatus(telegramId, !currentStatus);
    if (updated) {
      setUsers(prev =>
        prev.map(user =>
          user.telegramId === telegramId ? { ...user, isBanned: !currentStatus } : user
        )
      );
    }
  };

  // Task Handlers
  const handleNewTaskChange = (field, value) => {
    setNewTask(prev => ({ ...prev, [field]: value }));
  };

  const handleNewTaskVerificationTypeChange = (value) => {
    setNewTask(prev => ({ ...prev, verificationType: value }));
  };

  const handleAddTask = async () => {
    const success = await createTask(newTask);
    if (success) {
      const taskList = await getAllTasks();
      setTasks(taskList);
      setNewTask({ title: '', description: '', reward: 0, active: true, type: '', verificationType: 'auto' });
    }
  };

  const handleEditClick = (task) => {
    setEditingTask(task);
  };

  const handleEditingTaskChange = (field, value) => {
    setEditingTask(prev => ({ ...prev, [field]: value }));
  };

  const handleEditingTaskActiveChange = (value) => {
    setEditingTask(prev => ({ ...prev, active: value }));
  };

  const handleEditingTaskVerificationTypeChange = (value) => {
    setEditingTask(prev => ({ ...prev, verificationType: value }));
  };

  const handleUpdateTask = async () => {
    const success = await updateTask(editingTask.id, editingTask);
    if (success) {
      const taskList = await getAllTasks();
      setTasks(taskList);
      setEditingTask(null);
    }
  };

  const handleDeleteTask = async (taskId) => {
    const success = await deleteTask(taskId);
    if (success) {
      const taskList = await getAllTasks();
      setTasks(taskList);
    }
  };

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
              {loadingUsers ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <UserManagementTab
                  users={users}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  handleBanToggle={handleBanToggle}
                />
              )}
            </TabsContent>

            <TabsContent value="tasks" className="mt-4">
              <TaskManagementTab
                tasks={tasks}
                newTask={newTask}
                editingTask={editingTask}
                handleNewTaskChange={handleNewTaskChange}
                handleNewTaskVerificationTypeChange={handleNewTaskVerificationTypeChange}
                handleAddTask={handleAddTask}
                handleEditingTaskChange={handleEditingTaskChange}
                handleEditingTaskActiveChange={handleEditingTaskActiveChange}
                handleEditingTaskVerificationTypeChange={handleEditingTaskVerificationTypeChange}
                handleUpdateTask={handleUpdateTask}
                setEditingTask={setEditingTask}
                handleEditClick={handleEditClick}
                handleDeleteTask={handleDeleteTask}
              />
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
                
