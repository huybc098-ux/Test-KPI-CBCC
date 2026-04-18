import React from 'react';
import { useTasks } from '../store';
import { calculateKPI, getCompletionQuality } from '../utils';
import { CheckCircle2, AlertCircle, Clock, ListTodo, Zap } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { tasks } = useTasks();

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const overdueTasks = tasks.filter(t => t.status === 'OVERDUE').length;
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'NOT_STARTED').length;

  // Calculate average KPI
  const completedWithKPI = tasks.filter(t => t.status === 'COMPLETED').map(t => calculateKPI(t)).filter(kpi => kpi !== null) as number[];
  const averageKPI = completedWithKPI.length > 0 
    ? (completedWithKPI.reduce((a, b) => a + b, 0) / completedWithKPI.length).toFixed(1)
    : '0.0';

  // KPI by assignee
  const assigneeStats = tasks.reduce((acc, task) => {
    if (!acc[task.assignee]) {
      acc[task.assignee] = { 
        total: 0, 
        completed: 0, 
        kpiSum: 0, 
        kpiCount: 0,
        beforeDeadline: 0,
        onDeadline: 0,
        afterDeadline: 0
      };
    }
    acc[task.assignee].total += 1;
    if (task.status === 'COMPLETED') {
      acc[task.assignee].completed += 1;
      const kpi = calculateKPI(task);
      if (kpi !== null) {
        acc[task.assignee].kpiSum += kpi;
        acc[task.assignee].kpiCount += 1;
      }

      const quality = getCompletionQuality(task);
      if (quality === 'BEFORE_DEADLINE') acc[task.assignee].beforeDeadline += 1;
      else if (quality === 'ON_DEADLINE') acc[task.assignee].onDeadline += 1;
      else if (quality === 'AFTER_DEADLINE') acc[task.assignee].afterDeadline += 1;
    }
    return acc;
  }, {} as Record<string, { 
    total: number, 
    completed: number, 
    kpiSum: number, 
    kpiCount: number,
    beforeDeadline: number,
    onDeadline: number,
    afterDeadline: number
  }>);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-sm font-medium text-gray-500 mb-1">Điểm KPI Trung Bình</h2>
        <div className="flex items-end gap-2">
          <span className="text-4xl font-bold text-gray-900">{averageKPI}</span>
          <span className="text-sm text-gray-500 mb-1">/ 10</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-2">
            <ListTodo className="text-blue-600" size={20} />
          </div>
          <span className="text-2xl font-bold text-gray-900">{totalTasks}</span>
          <span className="text-xs text-gray-500 mt-1">Tổng nhiệm vụ</span>
        </div>
        
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-2">
            <CheckCircle2 className="text-green-600" size={20} />
          </div>
          <span className="text-2xl font-bold text-gray-900">{completedTasks}</span>
          <span className="text-xs text-gray-500 mt-1">Đã hoàn thành</span>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center mb-2">
            <Clock className="text-yellow-600" size={20} />
          </div>
          <span className="text-2xl font-bold text-gray-900">{inProgressTasks}</span>
          <span className="text-xs text-gray-500 mt-1">Đang xử lý</span>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-2">
            <AlertCircle className="text-red-600" size={20} />
          </div>
          <span className="text-2xl font-bold text-gray-900">{overdueTasks}</span>
          <span className="text-xs text-gray-500 mt-1">Quá hạn</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">KPI Theo Cán Bộ</h3>
        <div className="space-y-6">
          {Object.entries(assigneeStats).map(([name, stats]: [string, any]) => {
            const avg = stats.kpiCount > 0 ? (stats.kpiSum / stats.kpiCount).toFixed(1) : '-';
            return (
              <div key={name} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-gray-900">{name}</p>
                    <p className="text-[10px] text-gray-500">{stats.completed}/{stats.total} hoàn thành</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-900">{avg}</span>
                    <span className="text-[10px] text-gray-500 ml-1 uppercase font-medium">Điểm</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center justify-center py-2 rounded-xl bg-green-50/50 border border-green-100">
                    <Zap size={12} className="text-green-600 mb-1" />
                    <span className="text-[8px] text-gray-500 uppercase font-bold">Trước hạn</span>
                    <span className="text-xs font-bold text-green-700">{stats.beforeDeadline}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center py-2 rounded-xl bg-blue-50/50 border border-blue-100">
                    <Clock size={12} className="text-blue-600 mb-1" />
                    <span className="text-[8px] text-gray-500 uppercase font-bold">Đúng hạn</span>
                    <span className="text-xs font-bold text-blue-700">{stats.onDeadline}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center py-2 rounded-xl bg-red-50/50 border border-red-100">
                    <AlertCircle size={12} className="text-red-600 mb-1" />
                    <span className="text-[8px] text-gray-500 uppercase font-bold">Chậm hạn</span>
                    <span className="text-xs font-bold text-red-700">{stats.afterDeadline}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {Object.keys(assigneeStats).length === 0 && (
            <p className="text-sm text-gray-500 text-center py-2">Chưa có dữ liệu</p>
          )}
        </div>
      </div>
    </div>
  );
};
