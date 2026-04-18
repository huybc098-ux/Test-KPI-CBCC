import React, { useState } from 'react';
import { useTasks } from '../store';
import { getStatusColor, getStatusLabel, calculateKPI, getCompletionQuality } from '../utils';
import { format, parseISO, differenceInDays, startOfDay } from 'date-fns';
import { Search, Calendar, User, FileText, CheckCircle, AlertTriangle, Building, Zap, Clock, AlertCircle, Edit2, X, FileCheck } from 'lucide-react';
import { Task, TaskStatus } from '../types';

const DEPARTMENTS_BY_BLOCK: Record<string, string[]> = {
  'Khối Đảng uỷ': [
    'Ban Xây dựng Đảng',
    'Uỷ ban kiểm tra Đảng uỷ',
    'Văn phòng Đảng uỷ'
  ],
  'Khối Chính quyền (UBND)': [
    'Văn phòng HĐND & UBND',
    'Phòng Kinh tế',
    'Phòng Văn hoá - Xã hội',
    'Trung tâm phục vụ hành chính công',
    'Trung tâm Dịch vụ tổng hợp',
    'Trạm Y tế xã',
    'Ban Chỉ huy quân sự xã'
  ],
  'Khối MTTQ và các tổ chức chính trị xã hội': [
    'Hội LHPN xã',
    'Hội Cựu Chiến Binh',
    'Hội Nông dân',
    'Đoàn TNCS Hồ Chí Minh'
  ]
};

export const TaskList: React.FC = () => {
  const { tasks, updateTask, user, userRole } = useTasks();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'ALL'>('ALL');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const [completingTask, setCompletingTask] = useState<Task | null>(null);
  const [evidenceData, setEvidenceData] = useState({ number: '', date: format(new Date(), 'yyyy-MM-dd') });

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.summary.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          task.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          task.assignee.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (task.department && task.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (task.block && task.block.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'ALL' || task.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getDeadlineWarning = (deadline: string, status: TaskStatus) => {
    if (status === 'COMPLETED' || status === 'OVERDUE') return null;
    const diff = differenceInDays(startOfDay(parseISO(deadline)), startOfDay(new Date()));
    if (diff === 0) return 'Đến hạn hôm nay';
    if (diff === 1) return 'Còn 1 ngày';
    if (diff === 2) return 'Còn 2 ngày';
    return null;
  };

  const openCompleteModal = (task: Task) => {
    setEvidenceData({ number: '', date: format(new Date(), 'yyyy-MM-dd') });
    setCompletingTask(task);
  };

  const submitComplete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingTask) return;
    updateTask(completingTask.id, { 
      status: 'COMPLETED', 
      completionDate: new Date().toISOString(),
      evidenceDocumentNumber: evidenceData.number,
      evidenceDocumentDate: evidenceData.date
    });
    setCompletingTask(null);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editingTask) return;
    const { name, value } = e.target;
    setEditingTask({ ...editingTask, [name]: value });
  };

  const handleEditBlockChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!editingTask) return;
    const block = e.target.value;
    setEditingTask({ ...editingTask, block, department: '' });
  };

  const submitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    
    const updates: Partial<Task> = {
      documentNumber: editingTask.documentNumber,
      summary: editingTask.summary,
      documentDate: editingTask.documentDate,
      assignedDate: editingTask.assignedDate,
      deadline: editingTask.deadline,
      assignee: editingTask.assignee,
      block: editingTask.block,
      department: editingTask.department,
    };

    if (editingTask.evidenceDocumentNumber !== undefined) {
      updates.evidenceDocumentNumber = editingTask.evidenceDocumentNumber;
    }
    if (editingTask.evidenceDocumentDate !== undefined) {
      updates.evidenceDocumentDate = editingTask.evidenceDocumentDate;
    }

    updateTask(editingTask.id, updates);
    setEditingTask(null);
  };

  return (
    <div className="space-y-4 relative">
      <div className="sticky top-0 bg-gray-50 pt-2 pb-4 z-10 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm nhiệm vụ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {['ALL', 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filterStatus === status 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {status === 'ALL' ? 'Tất cả' : getStatusLabel(status as TaskStatus)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-sm">
            Không tìm thấy nhiệm vụ nào.
          </div>
        ) : (
          filteredTasks.map(task => {
            const kpi = calculateKPI(task);
            const warningText = getDeadlineWarning(task.deadline, task.status);
            
            return (
              <div key={task.id} className={`bg-white p-4 rounded-2xl shadow-sm border ${warningText ? 'border-yellow-300 bg-yellow-50/30' : 'border-gray-100'} space-y-3 relative group`}>
                {(user?.uid === task.createdBy || userRole === 'admin') && (
                  <button
                    onClick={() => setEditingTask(task)}
                    className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Chỉnh sửa nhiệm vụ"
                  >
                    <Edit2 size={16} />
                  </button>
                )}
                
                <div className="flex justify-between items-start gap-2 pr-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${getStatusColor(task.status)}`}>
                        {getStatusLabel(task.status)}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">{task.documentNumber}</span>
                      {warningText && (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded">
                          <AlertTriangle size={10} /> {warningText}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
                      {task.summary}
                    </h3>
                  </div>
                  {kpi !== null && (
                    <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-2 min-w-[48px]">
                      <span className="text-sm font-bold text-gray-900">{kpi}</span>
                      <span className="text-[8px] text-gray-500 uppercase">Điểm</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-y-2 text-xs text-gray-600 border-t border-gray-50 pt-2">
                  <div className="flex items-center gap-1.5 col-span-2">
                    <User size={14} className="text-gray-400 shrink-0" />
                    <span className="truncate font-medium text-gray-700">{task.assignee}</span>
                    {(task.block || task.department) && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span className="truncate text-gray-500">
                          {task.department ? task.department : ''}
                          {task.department && task.block ? ' - ' : ''}
                          {task.block ? task.block : ''}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileText size={14} className="text-gray-400" />
                    <span>{format(parseISO(task.documentDate), 'dd/MM/yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-gray-400" />
                    <span>Giao: <span className="font-medium text-gray-900">{format(parseISO(task.assignedDate), 'dd/MM/yyyy')}</span></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-gray-400" />
                    <span>Hạn: <span className={`font-medium ${warningText ? 'text-yellow-700' : 'text-gray-900'}`}>{format(parseISO(task.deadline), 'dd/MM/yyyy')}</span></span>
                  </div>
                  {task.completionDate && (
                    <div className="flex flex-col gap-1 col-span-2 mt-1">
                      <div className="flex items-center gap-1.5 text-green-600">
                        <CheckCircle size={14} />
                        <span>Xong: {format(parseISO(task.completionDate), 'dd/MM/yyyy')}</span>
                        {task.evidenceDocumentNumber && (
                          <span className="text-gray-400 mx-1">•</span>
                        )}
                        {task.evidenceDocumentNumber && (
                          <div className="flex items-center gap-1 text-gray-700">
                            <FileCheck size={12} className="text-blue-500" />
                            <span>Minh chứng: <strong>{task.evidenceDocumentNumber}</strong></span>
                            {task.evidenceDocumentDate && (
                              <span className="ml-1 text-gray-500">({format(parseISO(task.evidenceDocumentDate), 'dd/MM/yyyy')})</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="mt-1">
                      {(() => {
                        const quality = getCompletionQuality(task);
                        if (quality === 'BEFORE_DEADLINE') {
                          return (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded w-fit uppercase tracking-tight">
                              <Zap size={10} /> Hoàn thành trước hạn
                            </div>
                          );
                        }
                        if (quality === 'ON_DEADLINE') {
                          return (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded w-fit uppercase tracking-tight">
                              <Clock size={10} /> Hoàn thành đúng hạn
                            </div>
                          );
                        }
                        if (quality === 'AFTER_DEADLINE') {
                          return (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded w-fit uppercase tracking-tight">
                              <AlertCircle size={10} /> Hoàn thành chậm hạn
                            </div>
                          );
                        }
                        return null;
                      })()}
                      </div>
                    </div>
                  )}
                </div>

                {task.status !== 'COMPLETED' && (
                  <div className="pt-2 border-t border-gray-50 flex justify-end gap-2">
                    {task.status === 'NOT_STARTED' && (user?.uid === task.createdBy || userRole === 'admin') && (
                      <button 
                        onClick={() => updateTask(task.id, { status: 'IN_PROGRESS' })}
                        className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        Bắt đầu xử lý
                      </button>
                    )}
                    {(user?.uid === task.createdBy || userRole === 'admin') && (
                      <button 
                        onClick={() => openCompleteModal(task)}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        Hoàn thành
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Completion Modal */}
      {completingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="border-b px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Xác nhận hoàn thành</h3>
              <button 
                onClick={() => setCompletingTask(null)}
                className="p-1 text-gray-400 hover:text-gray-900 rounded-lg shrink-0"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={submitComplete} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Số văn bản minh chứng</label>
                <input
                  required
                  type="text"
                  value={evidenceData.number}
                  onChange={(e) => setEvidenceData({...evidenceData, number: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: 15/BC-UBND"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Ngày văn bản minh chứng</label>
                <input
                  required
                  type="date"
                  value={evidenceData.date}
                  onChange={(e) => setEvidenceData({...evidenceData, date: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto w-full">
            <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-center justify-between z-10 rounded-t-2xl">
              <h3 className="font-bold text-gray-900">Chỉnh sửa nhiệm vụ</h3>
              <button 
                onClick={() => setEditingTask(null)}
                className="p-1 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={submitEdit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Số ký hiệu văn bản</label>
                <input
                  required
                  type="text"
                  name="documentNumber"
                  value={editingTask.documentNumber}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nội dung trích yếu (công việc)</label>
                <textarea
                  required
                  name="summary"
                  value={editingTask.summary}
                  onChange={handleEditChange}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Khối cơ quan</label>
                <select
                  required
                  name="block"
                  value={editingTask.block}
                  onChange={handleEditBlockChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                >
                  <option value="">-- Chọn khối cơ quan --</option>
                  {Object.keys(DEPARTMENTS_BY_BLOCK).map(block => (
                    <option key={block} value={block}>{block}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Đơn vị công tác</label>
                  <select
                    required
                    name="department"
                    value={editingTask.department}
                    onChange={handleEditChange}
                    disabled={!editingTask.block}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white disabled:opacity-50"
                  >
                    <option value="">-- Chọn đơn vị --</option>
                    {editingTask.block && DEPARTMENTS_BY_BLOCK[editingTask.block].map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cán bộ thực hiện</label>
                  <input
                    required
                    type="text"
                    name="assignee"
                    value={editingTask.assignee}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Ngày văn bản</label>
                  <input
                    required
                    type="date"
                    name="documentDate"
                    value={editingTask.documentDate}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Ngày giao</label>
                  <input
                    required
                    type="date"
                    name="assignedDate"
                    value={editingTask.assignedDate}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Hạn hoàn thành</label>
                <input
                  required
                  type="date"
                  name="deadline"
                  value={editingTask.deadline}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
              
              {editingTask.status === 'COMPLETED' && (
                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 mt-2">
                  <h4 className="text-xs font-semibold text-blue-900 mb-2">Minh chứng hoàn thành</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700 mb-1">Số văn bản minh chứng</label>
                      <input
                        type="text"
                        name="evidenceDocumentNumber"
                        value={editingTask.evidenceDocumentNumber || ''}
                        onChange={handleEditChange}
                        className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700 mb-1">Ngày văn bản</label>
                      <input
                        type="date"
                        name="evidenceDocumentDate"
                        value={editingTask.evidenceDocumentDate || ''}
                        onChange={handleEditChange}
                        className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 sticky bottom-4">
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

