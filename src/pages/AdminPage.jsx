import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Loader2, Users, ListChecks, CheckSquare } from 'lucide-react';
import { UserContext } from '@/App';

import UserManagementTab from '@/components/admin/UserManagementTab';
import TaskManagementTab from '@/components/admin/TaskManagementTab';
import PendingVerificationTab from '@/components/admin/PendingVerificationTab';

import {
  getAllUsers,
  toggleUserBanStatus
} from '@/data/firestore/userActions';
import {
  getAllTasks,
  addTask,
  updateTask,
  deleteTask
} from '@/data/firestore/taskActions';
import {
  getPendingVerifications,
  approveTask,
  rejectTask
} from '@/data/firestore/adminActions';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const AdminPage = () => {
  const context = useContext(UserContext);
  const sessionUser = JSON.parse(sessionStorage.getItem('tgUserData') || '{}');
  const user = context?.user || sessionUser;

  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [pendingItems, setPendingItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingPending, setLoadingPending] = useState(true);
  const [tab, setTab] = useState('users');

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    reward: 0,
    type: 'telegram_join',
    target: '',
    verificationType: 'manual',
    active: true
  });

  const [editingTask, setEditingTask] = useState(null);

  const fetchAllData = async () => {
    setLoadingUsers(true);
    setLoadingTasks(true);
    setLoadingPending(true);

    const [userList, taskList, pendingList] = await Promise.all([
      getAllUsers(),
      getAllTasks(),
      getPendingVerifications()
    ]);

    setUsers(userList || []);
    setTasks(taskList || []);
    setPendingItems(pendingList || []);
    setLoadingUsers(false);
    setLoadingTasks(false);
    setLoadingPending(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleBanToggle = async (telegramId, currentStatus) => {
    const updated = await toggleUserBanStatus(telegramId, !currentStatus);
    if (updated) {
      setUsers(prev => prev.map(u =>
        u.telegramId === telegramId ? { ...u, isBanned: !currentStatus } : u
      ));
    }
  };

  const handleNewTaskChange = (e) => {
    const { name, value } = e.target;
    setNewTask(prev => ({ ...prev, [name]: value }));
  };

  const handleNewTaskVerificationTypeChange = (value) => {
    setNewTask(prev => ({ ...prev, verificationType: value }));
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    const success = await addTask(newTask);
    if (success) {
      const updatedTasks = await getAllTasks();
      setTasks(updatedTasks);
      setNewTask({
        title: '',
        description: '',
        reward: 0,
        type: 'telegram_join',
        target: '',
        verificationType: 'manual',
        active: true
      });
    }
  };

  const handleEditClick = (task) => setEditingTask(task);

  const handleEditingTaskChange = (e) => {
    const { name, value } = e.target;
    setEditingTask(prev => ({ ...prev, [name]: value }));
  };

  const handleEditingTaskVerificationTypeChange = (value) => {
    setEditingTask(prev => ({ ...prev, verificationType: value }));
  };

  const handleEditingTaskActiveChange = (checked) => {
    setEditingTask(prev => ({ ...prev, active: checked }));
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    const success = await updateTask(editingTask.id, editingTask);
    if (success) {
      const updatedTasks = await getAllTasks();
      setTasks(updatedTasks);
      setEditingTask(null);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    const success = await deleteTask(taskId);
    if (success) {
      const updatedTasks = await getAllTasks();
      setTasks(updatedTasks);
    }
  };

  const handleApprove = async (userId, taskId) => {
    const success = await approveTask(userId, taskId);
    if (success) {
      const updatedPending = await getPendingVerifications();
      setPendingItems(updatedPending);
    }
  };

  const handleReject = async (userId, taskId) => {
    const success = await rejectTask(userId, taskId);
    if (success) {
      const updatedPending = await getPendingVerifications();
      setPendingItems(updatedPending);
    }
  };

  const handleTabChange = async (value) => {
    setTab(value);
    if (value === 'users') {
      setLoadingUsers(true);
      const userList = await getAllUsers();
      setUsers(userList || []);
      setLoadingUsers(false);
    } else if (value === 'tasks') {
      setLoadingTasks(true);
      const taskList = await getAllTasks();
      setTasks(taskList || []);
      setLoadingTasks(false);
    } else if (value === 'pending') {
      setLoadingPending(true);
      const pendingList = await getPendingVerifications();
      setPendingItems(pendingList || []);
      setLoadingPending(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('adminVerified');
      sessionStorage.removeItem('adminSession');
      window.location.reload(); // Reload the page to trigger the login screen
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full min-h-[100dvh] text-white px-4 pb-28 pt-6 bg-[#0f0f0f] overflow-y-auto"
    >
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div className="w-10"></div> {/* Spacer to center the heading */}
          <div className="text-center flex-1">
            <h2 className="text-xl font-bold">Admin Dashboard</h2>
            <p className="text-sm text-muted-foreground">Control center for managing tasks and users</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-10 flex items-center justify-center text-red-500 hover:text-red-400 bg-[#1a1a1a] p-2 rounded-md shadow-sm transition"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>

        <Tabs value={tab} onValueChange={handleTabChange} className="w-full bg-[#0f0f0f]">
          <TabsList className="grid grid-cols-3 bg-[#1a1a1a] text-white rounded-lg shadow-md">
            <TabsTrigger value="users" className="flex items-center justify-center gap-1 py-2 rounded-lg data-[state=active]:bg-primary/80">
              <Users className="h-4 w-4" /> Users
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center justify-center gap-1 py-2 rounded-lg data-[state=active]:bg-primary/80">
              <ListChecks className="h-4 w-4" /> Tasks
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center justify-center gap-1 py-2 rounded-lg data-[state=active]:bg-primary/80">
              <CheckSquare className="h-4 w-4" /> Pending
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="pt-4">
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

          <TabsContent value="tasks" className="pt-4">
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

          <TabsContent value="pending" className="pt-4">
            {loadingPending ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <PendingVerificationTab
                pendingItems={pendingItems}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
};

export default AdminPage;
