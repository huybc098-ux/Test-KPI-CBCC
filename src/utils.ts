import { Task, TaskStatus } from './types';
import { isBefore, isSameDay, differenceInDays, startOfDay, parseISO } from 'date-fns';

export type CompletionQuality = 'BEFORE_DEADLINE' | 'ON_DEADLINE' | 'AFTER_DEADLINE' | null;

export function getCompletionQuality(task: Task): CompletionQuality {
  if (task.status !== 'COMPLETED' || !task.completionDate) return null;

  const completed = startOfDay(parseISO(task.completionDate));
  const deadline = startOfDay(parseISO(task.deadline));

  if (isBefore(completed, deadline)) return 'BEFORE_DEADLINE';
  if (isSameDay(completed, deadline)) return 'ON_DEADLINE';
  return 'AFTER_DEADLINE';
}

export function calculateKPI(task: Task): number | null {
  if (task.status !== 'COMPLETED' || !task.completionDate) {
    const today = startOfDay(new Date());
    const deadline = startOfDay(parseISO(task.deadline));
    if (today > deadline && task.status !== 'COMPLETED') {
        return 0; // Overdue and not done
    }
    return null; // Not done yet, not overdue
  }

  const completed = startOfDay(parseISO(task.completionDate));
  const deadline = startOfDay(parseISO(task.deadline));

  if (isBefore(completed, deadline)) return 10;
  if (isSameDay(completed, deadline)) return 7;

  const diffDays = differenceInDays(completed, deadline);
  if (diffDays <= 2) return 3;
  return 0;
}

export function getTaskStatus(task: Task): TaskStatus {
  if (task.status === 'COMPLETED') return 'COMPLETED';
  
  const today = startOfDay(new Date());
  const deadline = startOfDay(parseISO(task.deadline));
  
  if (today > deadline) return 'OVERDUE';
  return task.status;
}

export function getStatusLabel(status: TaskStatus): string {
  switch (status) {
    case 'NOT_STARTED': return 'Chưa làm';
    case 'IN_PROGRESS': return 'Đang xử lý';
    case 'COMPLETED': return 'Hoàn thành';
    case 'OVERDUE': return 'Quá hạn';
    default: return '';
  }
}

export function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case 'NOT_STARTED': return 'bg-gray-100 text-gray-800';
    case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
    case 'COMPLETED': return 'bg-green-100 text-green-800';
    case 'OVERDUE': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function getRating(score: number, hasOverdue: boolean): { label: string, color: string } {
  // Rule: If there are overdue tasks, the highest rating is "Hoàn thành nhiệm vụ"
  if (hasOverdue) {
    if (score < 3) return { label: 'Không hoàn thành nhiệm vụ', color: 'text-red-600 bg-red-50 border-red-100' };
    return { label: 'Hoàn thành nhiệm vụ', color: 'text-yellow-600 bg-yellow-50 border-yellow-100' };
  }

  // Normal rating scale based on points
  if (score < 3) return { label: 'Không hoàn thành nhiệm vụ', color: 'text-red-600 bg-red-50 border-red-100' };
  if (score < 5) return { label: 'Hoàn thành nhiệm vụ', color: 'text-yellow-600 bg-yellow-50 border-yellow-100' };
  if (score <= 8.9) return { label: 'Hoàn thành tốt nhiệm vụ', color: 'text-blue-600 bg-blue-50 border-blue-100' };
  return { label: 'Hoàn thành xuất sắc nhiệm vụ', color: 'text-green-600 bg-green-50 border-green-100' };
}
