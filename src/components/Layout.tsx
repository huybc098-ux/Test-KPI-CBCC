import React from 'react';
import { LayoutDashboard, ListTodo, PlusCircle, BarChart3, LogOut, ShieldCheck } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTasks } from '../store';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { logout, user, userRole } = useTasks();
  
  const navItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'tasks', label: 'Công việc', icon: ListTodo },
    { id: 'add', label: 'Thêm mới', icon: PlusCircle },
    { id: 'reports', label: 'Báo cáo', icon: BarChart3 },
  ];

  if (userRole === 'admin') {
    navItems.push({ id: 'admin', label: 'Quản trị', icon: ShieldCheck });
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-gray-800">KPI Cán Bộ Xã</h1>
            <span className="text-xs text-gray-500">{user?.displayName || user?.email}</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={logout} className="p-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors" title="Đăng xuất">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-20">
        <div className="max-w-md mx-auto">
          {children}
        </div>
      </main>

      <nav className="bg-white border-t fixed bottom-0 w-full pb-safe z-10">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full space-y-1",
                  isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
                )}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
