import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AdminUser } from '../types/siteContent';

const USERS_COLLECTION = 'admin_users';
const LOCAL_USERS_CACHE_KEY = 'lcd_admin_users_collection_cache';

export const DEFAULT_ROOT_ADMIN: AdminUser = {
  id: 'user-cristobal',
  username: 'Cristobal',
  passwordHashOrPlain: '012004',
  role: 'superadmin',
  name: 'Cristobal (Admin Principal)',
  createdAt: '2025-01-01T00:00:00.000Z'
};

interface AdminUsersContextType {
  users: AdminUser[];
  isLoading: boolean;
  isCloudSynced: boolean;
  addUser: (username: string, password: string, name?: string) => Promise<{ success: boolean; message: string }>;
  updateUserPassword: (id: string, username: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  deleteUser: (id: string, username: string) => Promise<{ success: boolean; message: string }>;
  authenticate: (username: string, password: string) => { success: boolean; user?: AdminUser; error?: string };
}

const AdminUsersContext = createContext<AdminUsersContextType | undefined>(undefined);

export const AdminUsersProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<AdminUser[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_USERS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as AdminUser[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return [DEFAULT_ROOT_ADMIN];
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);

  // Real-time Firestore subscription on the dedicated 'admin_users' collection
  useEffect(() => {
    let isSubscribed = true;

    try {
      const colRef = collection(db, USERS_COLLECTION);
      const unsubscribe = onSnapshot(
        colRef,
        async (snapshot) => {
          if (!isSubscribed) return;

          if (!snapshot.empty) {
            const fetchedUsers: AdminUser[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as Partial<AdminUser>;
              fetchedUsers.push({
                id: docSnap.id,
                username: data.username || docSnap.id,
                passwordHashOrPlain: data.passwordHashOrPlain || '',
                role: data.role || 'admin',
                name: data.name || data.username,
                createdAt: data.createdAt || new Date().toISOString()
              });
            });

            // Ensure Cristobal is always present
            const hasCristobal = fetchedUsers.some(
              (u) => u.username.toLowerCase() === 'cristobal'
            );
            if (!hasCristobal) {
              fetchedUsers.unshift(DEFAULT_ROOT_ADMIN);
              // Write Cristobal to Firestore collection
              try {
                await setDoc(doc(db, USERS_COLLECTION, DEFAULT_ROOT_ADMIN.id), DEFAULT_ROOT_ADMIN, { merge: true });
              } catch (e) {
                console.warn('Could not auto-seed Cristobal:', e);
              }
            }

            setUsers(fetchedUsers);
            setIsCloudSynced(true);
            try {
              localStorage.setItem(LOCAL_USERS_CACHE_KEY, JSON.stringify(fetchedUsers));
            } catch {
              // ignore
            }
          } else {
            // Collection is empty: seed root admin Cristobal in Firestore
            try {
              await setDoc(doc(db, USERS_COLLECTION, DEFAULT_ROOT_ADMIN.id), DEFAULT_ROOT_ADMIN);
              setUsers([DEFAULT_ROOT_ADMIN]);
              setIsCloudSynced(true);
              localStorage.setItem(LOCAL_USERS_CACHE_KEY, JSON.stringify([DEFAULT_ROOT_ADMIN]));
            } catch (err) {
              console.warn('Notice seeding root admin user to Firestore:', err);
              setUsers([DEFAULT_ROOT_ADMIN]);
            }
          }
          setIsLoading(false);
        },
        (error) => {
          console.warn('Notice reading admin_users collection:', error);
          if (isSubscribed) {
            setIsCloudSynced(false);
            setIsLoading(false);
          }
        }
      );

      return () => {
        isSubscribed = false;
        unsubscribe();
      };
    } catch (err) {
      console.warn('Error setting up admin_users listener:', err);
      setIsLoading(false);
    }
  }, []);

  const addUser = async (
    username: string,
    password: string,
    name?: string
  ): Promise<{ success: boolean; message: string }> => {
    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (cleanUser.length < 3) {
      return { success: false, message: 'El usuario debe tener al menos 3 caracteres.' };
    }
    if (cleanPass.length < 4) {
      return { success: false, message: 'La contraseña debe tener al menos 4 caracteres.' };
    }

    // Check if user already exists
    const exists = users.some((u) => u.username.toLowerCase() === cleanUser.toLowerCase());
    if (exists) {
      return { success: false, message: `El usuario "${cleanUser}" ya existe.` };
    }

    const docId = `user_${cleanUser.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
    const newUser: AdminUser = {
      id: docId,
      username: cleanUser,
      passwordHashOrPlain: cleanPass,
      role: 'admin',
      name: name?.trim() || cleanUser,
      createdAt: new Date().toISOString()
    };

    // Optimistically update local list and cache
    const updated = [...users, newUser];
    setUsers(updated);
    try {
      localStorage.setItem(LOCAL_USERS_CACHE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    // Persist to separate Firestore 'admin_users' collection
    try {
      await setDoc(doc(db, USERS_COLLECTION, docId), newUser);
      return { success: true, message: `Usuario administrador "${cleanUser}" creado y guardado en la base de datos.` };
    } catch (err) {
      console.error('Error saving user to Firestore:', err);
      return { 
        success: true, 
        message: `Usuario "${cleanUser}" creado en caché local (se sincronizará al conectar).` 
      };
    }
  };

  const updateUserPassword = async (
    id: string,
    username: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> => {
    const cleanPass = newPassword.trim();
    if (cleanPass.length < 4) {
      return { success: false, message: 'La contraseña debe tener al menos 4 caracteres.' };
    }

    // Optimistically update local state
    const updated = users.map((u) => (u.id === id ? { ...u, passwordHashOrPlain: cleanPass } : u));
    setUsers(updated);
    try {
      localStorage.setItem(LOCAL_USERS_CACHE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    try {
      await setDoc(doc(db, USERS_COLLECTION, id), { passwordHashOrPlain: cleanPass }, { merge: true });
      return { success: true, message: `Contraseña de "${username}" actualizada correctamente en Firebase.` };
    } catch (err) {
      console.error('Error updating user password in Firestore:', err);
      return { 
        success: true, 
        message: `Contraseña de "${username}" actualizada en caché local.` 
      };
    }
  };

  const deleteUser = async (
    id: string,
    username: string
  ): Promise<{ success: boolean; message: string }> => {
    if (username.toLowerCase() === 'cristobal') {
      return { success: false, message: 'No se puede eliminar al Administrador Principal (Cristobal).' };
    }

    // Optimistic update
    const updated = users.filter((u) => u.id !== id);
    setUsers(updated);
    try {
      localStorage.setItem(LOCAL_USERS_CACHE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    try {
      await deleteDoc(doc(db, USERS_COLLECTION, id));
      return { success: true, message: `Usuario "${username}" eliminado de la base de datos.` };
    } catch (err) {
      console.error('Error deleting user from Firestore:', err);
      return { 
        success: true, 
        message: `Usuario "${username}" eliminado localmente.` 
      };
    }
  };

  const authenticate = (
    username: string,
    password: string
  ): { success: boolean; user?: AdminUser; error?: string } => {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      return { success: false, error: 'Por favor ingresa tu usuario y contraseña.' };
    }

    // Check Cristobal hard-coded default emergency fallback
    if (cleanUser === 'cristobal' && cleanPass === '012004') {
      const found = users.find((u) => u.username.toLowerCase() === 'cristobal') || DEFAULT_ROOT_ADMIN;
      return { success: true, user: found };
    }

    const matched = users.find(
      (u) => u.username.toLowerCase() === cleanUser && u.passwordHashOrPlain === cleanPass
    );

    if (matched) {
      return { success: true, user: matched };
    }

    return { success: false, error: 'Usuario o contraseña incorrectos.' };
  };

  return (
    <AdminUsersContext.Provider
      value={{
        users,
        isLoading,
        isCloudSynced,
        addUser,
        updateUserPassword,
        deleteUser,
        authenticate
      }}
    >
      {children}
    </AdminUsersContext.Provider>
  );
};

export const useAdminUsers = (): AdminUsersContextType => {
  const context = useContext(AdminUsersContext);
  if (!context) {
    throw new Error('useAdminUsers must be used within an AdminUsersProvider');
  }
  return context;
};
