import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TaskForm from '@/components/admin/TaskForm';
import TaskList from '@/components/admin/TaskList';

// This component orchestrates TaskForm and TaskList
const TaskManagementTab = ({
  tasks = [],
  newTask,
  editingTask,
  handleNewTaskChange,
  handleNewTaskVerificationTypeChange,
  handleAddTask,
  handleEditingTaskChange,
  handleEditingTaskActiveChange,
  handleEditingTaskVerificationTypeChange,
  handleUpdateTask,
  setEditingTask,
  handleEditClick,
  handleDeleteTask
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</CardTitle>
            <CardDescription>
              {editingTask
                ? 'Modify the details of the existing task.'
                : 'Create a new task for users to complete.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TaskForm
              taskData={editingTask || newTask}
              isEditing={!!editingTask}
              onChange={editingTask ? handleEditingTaskChange : handleNewTaskChange}
              onActiveChange={editingTask ? handleEditingTaskActiveChange : undefined}
              onVerificationTypeChange={
                editingTask
                  ? handleEditingTaskVerificationTypeChange
                  : handleNewTaskVerificationTypeChange
              }
              onSubmit={editingTask ? handleUpdateTask : handleAddTask}
              onCancel={editingTask ? () => setEditingTask(null) : undefined}
            />
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Tasks</CardTitle>
            <CardDescription>Manage existing task definitions.</CardDescription>
          </CardHeader>
          <CardContent>
            <TaskList
              tasks={tasks}
              onEditClick={handleEditClick}
              onDeleteTask={handleDeleteTask}
              isEditing={!!editingTask}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TaskManagementTab;  
