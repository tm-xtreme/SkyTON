
import React from 'react';
import {
  getTasks,
  addTask,
  updateTask,
  deleteTask
} from '@/data/firestore/taskActions'; // Updated import path

// Fetches all task definitions from Firestore
export const getAllTasks = async () => {
  return await getTasks();
};

// Adds a new task definition to Firestore
export const addNewTask = async (newTaskData) => {
  return await addTask(newTaskData);
};

// Updates an existing task definition in Firestore
export const updateExistingTask = async (taskId, updates) => {
  return await updateTask(taskId, updates);
};

// Deletes a task definition from Firestore
export const deleteExistingTask = async (taskId) => {
  return await deleteTask(taskId);
};
  