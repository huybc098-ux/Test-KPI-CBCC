import React, { useState } from 'react';
import { useTasks } from '../store';
import { calculateKPI, getRating, getCompletionQuality } from '../utils';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Award, Zap, Clock, AlertCircle } from 'lucide-react';

export const Reports: React.FC = () => {
  const { tasks } = useTasks();
  const [reportType, setReportType] = useState<'WEEK' | 'MONTH'>('WEEK');

  const now = new Date();
  const interval = reportType === 'WEEK' 
    ? { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }
    : { start: startOfMonth(now), end: endOfMonth(now) };

  const filteredTasks = tasks.filter(task => {
    const date = parseISO(task.assignedDate);
    return isWithinInterval(date, interval);
  });

  // Calculate overall status distribution for the chart
  const statusCounts = filteredTasks.reduce((acc, task) => {
    const status = task.status;
    if (status === 'COMPLETED') acc.completed += 1;
    else if (status === 'OVERDUE') acc.overdue += 1;
    else acc.inProgress += 1;
    return acc;
  }, { completed: 0, overdue: 0, inProgress: 0 });

  const chartData = [
    { name: 'Hoàn thành', value: statusCounts.completed, color: '#10b981' },
    { name: 'Đang xử lý', value: statusCounts.inProgress, color: '#3b82f6' },
    { name: 'Quá hạn', value: statusCounts.overdue, color: '#ef4444' },
  ].filter(item => item.value > 0);

  const assigneeStats = filteredTasks.reduce((acc, task) => {
    if (!acc[task.assignee]) {
      acc[task.assignee] = { 
        total: 0, 
        completed: 0, 
        overdue: 0, 
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
    if (task.status === 'OVERDUE') {
      acc[task.assignee].overdue += 1;
    }
    return acc;
  }, {} as Record<string, { 
    total: number, 
    completed: number, 
    overdue: number, 
    kpiSum: number, 
    kpiCount: number,
    beforeDeadline: number,
    onDeadline: number,
    afterDeadline: number
  }>);

  return (
    <div className="space-y-4">
      <div className="flex bg-gray-100 p-1 rounded-xl">
        <button
          onClick={() => setReportType('WEEK')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            reportType === 'WEEK' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
          }`}
        >
          Tuần này
        </button>
        <button
          onClick={() => setReportType('MONTH')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            reportType === 'MONTH' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
          }`}
        >
          Tháng này
        </button>
      </div>

      {filteredTasks.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-2">Tỷ lệ trạng thái công việc</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ value }) => `${value}`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
        <h3 className="font-semibold text-gray-800">Báo cáo KPI chi tiết</h3>
        
        {Object.entries(assigneeStats).length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Không có dữ liệu trong thời gian này</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(assigneeStats).map(([name, stats]: [string, any]) => {
              const avgScore = stats.kpiCount > 0 ? (stats.kpiSum / stats.kpiCount) : 0;
              const avgDisplay = avgScore.toFixed(1);
              const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
              const rating = getRating(avgScore, stats.overdue > 0);
              
              return (
                <div key={name} className="border-b border-gray-50 pb-6 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="font-bold text-gray-900 text-base">{name}</span>
                      <div className={`mt-1 flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${rating.color}`}>
                        <Award size={12} />
                        {rating.label}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold text-gray-900">{avgDisplay}</span>
                      <span className="text-xs text-gray-500 ml-1">điểm</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-gray-50 rounded-lg py-2">
                      <div className="text-[10px] text-gray-500 mb-0.5">Tổng nhiệm vụ</div>
                      <div className="font-semibold text-gray-900">{stats.total}</div>
                    </div>
                    <div className="bg-green-50 rounded-lg py-2">
                      <div className="text-[10px] text-green-600 mb-0.5">Đã hoàn thành</div>
                      <div className="font-semibold text-green-700">{stats.completed}</div>
                    </div>
                    <div className="bg-red-50 rounded-lg py-2">
                      <div className="text-[10px] text-red-600 mb-0.5">Đang quá hạn</div>
                      <div className="font-semibold text-red-700">{stats.overdue}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="flex flex-col items-center justify-center p-2 rounded-lg border border-green-100 bg-green-50/30">
                      <Zap size={12} className="text-green-600 mb-1" />
                      <span className="text-[10px] text-gray-500">Trước hạn</span>
                      <span className="text-xs font-bold text-green-700">{stats.beforeDeadline}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 rounded-lg border border-blue-100 bg-blue-50/30">
                      <Clock size={12} className="text-blue-600 mb-1" />
                      <span className="text-[10px] text-gray-500">Đúng hạn</span>
                      <span className="text-xs font-bold text-blue-700">{stats.onDeadline}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 rounded-lg border border-red-100 bg-red-50/30">
                      <AlertCircle size={12} className="text-red-600 mb-1" />
                      <span className="text-[10px] text-gray-500">Chậm hạn</span>
                      <span className="text-xs font-bold text-red-700">{stats.afterDeadline}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                      <span>Tiến độ hoàn thành</span>
                      <span>{completionRate}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full" 
                        style={{ width: `${completionRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
