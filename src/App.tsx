/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TaskProvider, useTasks } from './store';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TaskList } from './components/TaskList';
import { TaskForm } from './components/TaskForm';
import { Reports } from './components/Reports';
import { AdminPanel } from './components/AdminPanel';

const AppContent = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user, loadingAuth, login } = useTasks();

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-sm w-full text-center space-y-6">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto">
            <span className="text-2xl font-bold text-blue-600">KPI</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Hệ Thống Quản Lý KPI</h1>
            <p className="text-sm text-gray-500 mt-2">Đăng nhập để vào hệ thống</p>
          </div>
          <button
            onClick={login}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
          >
            Đăng Nhập bằng Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'tasks' && <TaskList />}
      {activeTab === 'add' && <TaskForm onSuccess={() => setActiveTab('tasks')} />}
      {activeTab === 'reports' && <Reports />}
      {activeTab === 'admin' && <AdminPanel />}
    </Layout>
  );
};

export default function App() {
  return (
    <TaskProvider>
      <AppContent />
    </TaskProvider>
  );
}
