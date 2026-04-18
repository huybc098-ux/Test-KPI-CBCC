export type TaskStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';

export interface Task {
  id: string;
  documentNumber: string; // Số ký hiệu văn bản
  summary: string; // Nội dung trích yếu
  documentDate: string; // Ngày văn bản
  assignedDate: string; // Ngày giao
  deadline: string; // Hạn hoàn thành
  completionDate?: string; // Ngày hoàn thành
  assignee: string; // Người được giao
  block: string; // Khối cơ quan
  department: string; // Đơn vị công tác
  status: TaskStatus;
  evidenceDocumentNumber?: string; // Số văn bản minh chứng
  evidenceDocumentDate?: string; // Ngày tháng văn bản minh chứng
}
