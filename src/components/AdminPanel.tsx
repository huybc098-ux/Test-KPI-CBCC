import React, { useEffect, useState } from 'react';
import { useTasks } from '../store';
import { collection, query, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Shield, Trash2, UserCog, ShieldAlert } from 'lucide-react';

interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: string;
}

export const AdminPanel: React.FC = () => {
  const { userRole, resetAllData } = useTasks();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userRole !== 'admin') {
      setLoading(false);
      return;
    }

    const fetchUsers = async () => {
      try {
        const q = query(collection(db, 'users'));
        const snapshot = await getDocs(q);
        const userList = snapshot.docs.map(document => ({ 
          ...document.data(), 
          uid: document.id 
        } as AppUser));
        setUsers(userList);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [userRole]);

  const toggleRole = async (targetUserId: string, currentRole: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn chuyển quyền người này thành ${currentRole === 'admin' ? 'Nhân viên' : 'Quản trị viên'}?`)) {
      return;
    }
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      await updateDoc(doc(db, 'users', targetUserId), { role: newRole });
      setUsers(users.map(u => u.uid === targetUserId ? { ...u, role: newRole } : u));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${targetUserId}`);
    }
  };

  if (userRole !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-red-100">
        <ShieldAlert size={48} className="text-red-400 mb-4" />
        <h2 className="text-lg font-bold text-gray-900 mb-2">Truy cập bị từ chối</h2>
        <p className="text-sm text-gray-500">Khu vực này chỉ dành cho quản trị viên hệ thống.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-red-100 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-red-600 flex items-center gap-2">
            <Trash2 size={20} /> Xoá toàn bộ dữ liệu
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Hành động này sẽ xoá sạch toàn bộ nhiệm vụ trong hệ thống và không thể khôi phục lại được. Hãy cực kỳ cẩn thận.
          </p>
        </div>
        <button
          onClick={resetAllData}
          className="w-full py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl font-medium hover:bg-red-600 hover:text-white transition-colors flex justify-center items-center gap-2"
        >
          <Trash2 size={18} /> Xác nhận đặt lại hệ thống
        </button>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <UserCog size={20} className="text-blue-500" /> Quản lý người dùng
          </h2>
          <span className="text-xs font-medium bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
            {users.length} tài khoản
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center p-4">
            <div className="w-6 h-6 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map(u => (
              <div key={u.uid} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl bg-gray-50/50">
                <div className="flex-1 min-w-0 pr-3">
                  <div className="font-semibold text-gray-900 text-sm truncate">{u.displayName || 'Người dùng'}</div>
                  <div className="text-xs text-gray-500 truncate">{u.email}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                    {u.role === 'admin' ? 'Admin' : 'User'}
                  </span>
                  <button
                    onClick={() => toggleRole(u.uid, u.role)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title={u.role === 'admin' ? 'Hạ quyền người này' : 'Cấp quyền Admin'}
                  >
                    <Shield size={16} className={u.role === 'admin' ? 'fill-purple-200' : ''} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
