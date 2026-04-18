import React, { useState } from 'react';
import { useTasks } from '../store';
import { format } from 'date-fns';

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

export const TaskForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { addTask } = useTasks();
  const today = format(new Date(), 'yyyy-MM-dd');

  const [formData, setFormData] = useState({
    documentNumber: '',
    summary: '',
    documentDate: today,
    assignedDate: today,
    deadline: today,
    assignee: '',
    block: '',
    department: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTask({
      ...formData,
      status: 'NOT_STARTED',
    });
    onSuccess();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBlockChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const block = e.target.value;
    setFormData(prev => ({ ...prev, block, department: '' }));
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Giao Nhiệm Vụ Mới</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Số ký hiệu văn bản</label>
          <input
            required
            type="text"
            name="documentNumber"
            value={formData.documentNumber}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            placeholder="VD: 123/UBND-VP"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Nội dung trích yếu</label>
          <textarea
            required
            name="summary"
            value={formData.summary}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors resize-none"
            placeholder="Nội dung công việc cần thực hiện..."
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Khối cơ quan</label>
          <select
            required
            name="block"
            value={formData.block}
            onChange={handleBlockChange}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
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
              value={formData.department}
              onChange={handleChange}
              disabled={!formData.block}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors disabled:opacity-50"
            >
              <option value="">-- Chọn đơn vị --</option>
              {formData.block && DEPARTMENTS_BY_BLOCK[formData.block].map(dept => (
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
              value={formData.assignee}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              placeholder="Tên cán bộ"
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
              value={formData.documentDate}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Ngày giao</label>
            <input
              required
              type="date"
              name="assignedDate"
              value={formData.assignedDate}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Hạn hoàn thành</label>
          <input
            required
            type="date"
            name="deadline"
            value={formData.deadline}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors active:scale-[0.98]"
          >
            Lưu Nhiệm Vụ
          </button>
        </div>
      </form>
    </div>
  );
};
