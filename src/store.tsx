import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task } from './types';
import { getTaskStatus } from './utils';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  serverTimestamp,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { onAuthStateChanged, User, signInWithPopup, signOut } from 'firebase/auth';
import { db, auth, googleProvider, handleFirestoreError, OperationType } from './firebase';

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'status'>) => Promise<void>;
  updateTask: (id: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  resetAllData: () => Promise<void>;
  user: User | null;
  userRole: 'admin' | 'user' | null;
  loadingAuth: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Bootstrap user in Firestore if they don't exist
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (!userDoc.exists()) {
            // Default first user bootstrapping in rules allows this specific email to be admin
            const isEmailAdmin = currentUser.email === 'huybc098@gmail.com';
            const role = isEmailAdmin ? 'admin' : 'user';
            
            await setDoc(doc(db, 'users', currentUser.uid), {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || '',
              role: role
            }).catch(console.error); // Catch silently if they don't have permission to create
            
            setUserRole(role);
          } else {
            setUserRole(userDoc.data().role as 'admin' | 'user');
          }
        } catch (e) {
          console.error("Could not fetch user role:", e);
        }
      } else {
        setUserRole(null);
      }
      
      setLoadingAuth(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      return;
    }

    const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList = snapshot.docs.map(document => {
        const data = document.data();
        const task = { 
          ...data, 
          id: document.id 
        } as Task;
        // Recalculate status based on current time
        return { ...task, status: getTaskStatus(task) };
      });
      setTasks(taskList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tasks');
    });

    return () => unsubscribe();
  }, [user]);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const addTask = async (taskData: Omit<Task, 'id' | 'status'>) => {
    if (!user) throw new Error("Must be logged in to create tasks");

    try {
      const newTask = {
        ...taskData,
        status: 'NOT_STARTED',
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'tasks'), newTask);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tasks');
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const taskRef = doc(db, 'tasks', id);
      await updateDoc(taskRef, updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${id}`);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tasks/${id}`);
    }
  };

  const resetAllData = async () => {
    if (userRole !== 'admin') return;
    try {
      if (window.confirm("BẠN CÓ CHẮC CHẮN MUỐN XOÁ TẤT CẢ DỮ LIỆU? Hành động này không thể hoàn tác!")) {
        const promises = tasks.map(task => deleteDoc(doc(db, 'tasks', task.id)));
        await Promise.all(promises);
        window.alert("Đã reset tất cả dữ liệu hệ thống!");
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'tasks');
    }
  };

  return (
    <TaskContext.Provider value={{ tasks, addTask, updateTask, deleteTask, resetAllData, user, userRole, loadingAuth, login, logout }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
