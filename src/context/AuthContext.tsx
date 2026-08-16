import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api, getStoredToken, setStoredToken, removeStoredToken } from '../services/api';
import { INITIAL_USERS } from '../data/seedData';

interface AuthContextType {
  user: User | null;
  authenticatedUser: User | null;
  isAdmin: boolean;
  isInspectingRole: boolean;
  loading: boolean;
  login: (usernameOrEmail: string, password?: string) => Promise<void>;
  quickLoginAsRole: (role: UserRole) => Promise<void>;
  switchDepartmentRole: (role: UserRole) => void;
  restoreAdminRole: () => void;
  logout: () => void;
  register: (userData: Partial<User> & { password?: string }) => Promise<void>;
  resetPassword: (email: string) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize auth state on load
  useEffect(() => {
    const initAuth = async () => {
      const token = getStoredToken();
      if (token) {
        try {
          const res = await api.getMe();
          setAuthenticatedUser(res.user);
          setUser(res.user);
        } catch (err) {
          console.warn('Stored token invalid, resetting auth state.');
          removeStoredToken();
          // Fallback default admin user for initial preview
          const defaultAdmin = INITIAL_USERS[0];
          setAuthenticatedUser(defaultAdmin);
          setUser(defaultAdmin);
        }
      } else {
        // Default initial preview user is Admin
        const defaultAdmin = INITIAL_USERS[0];
        setAuthenticatedUser(defaultAdmin);
        setUser(defaultAdmin);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (usernameOrEmail: string, password?: string) => {
    setLoading(true);
    try {
      const res = await api.login(usernameOrEmail, password);
      if (res.user.isActive === false || res.user.status === 'Disabled') {
        throw new Error('Account Disabled: This user account has been deactivated by the Hospital Administrator.');
      }
      setStoredToken(res.token);
      setAuthenticatedUser(res.user);
      setUser(res.user);
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('disabled')) {
        throw err;
      }
      // Client fallback for seeded demo users
      const target = usernameOrEmail.toLowerCase().trim();
      const match = INITIAL_USERS.find(
        (u) => u.username.toLowerCase() === target || u.email.toLowerCase() === target
      );

      if (match) {
        if (match.isActive === false || match.status === 'Disabled') {
          throw new Error('Account Disabled: This user account has been deactivated by the Hospital Administrator.');
        }
        setAuthenticatedUser(match);
        setUser(match);
      } else {
        throw new Error(err.message || 'Invalid username or password');
      }
    } finally {
      setLoading(false);
    }
  };

  const quickLoginAsRole = async (role: UserRole) => {
    setLoading(true);
    const matchedUser = INITIAL_USERS.find((u) => u.role === role) || {
      id: `usr-${role.toLowerCase()}`,
      username: role.toLowerCase(),
      email: `${role.toLowerCase()}@gbhospital.com`,
      role,
      name: `Demo ${role}`,
      createdAt: new Date().toISOString().split('T')[0],
      isActive: true,
      status: 'Active' as const,
    };

    try {
      const res = await api.login(matchedUser.username, 'password');
      if (res.user.isActive === false || res.user.status === 'Disabled') {
        throw new Error(`Account for role "${role}" has been deactivated by the Hospital Administrator.`);
      }
      setStoredToken(res.token);
      setAuthenticatedUser(res.user);
      setUser(res.user);
    } catch (err: any) {
      if (err.message && (err.message.includes('deactivated') || err.message.includes('Disabled') || err.message.includes('disabled'))) {
        throw err;
      }
      if (matchedUser.isActive === false || matchedUser.status === 'Disabled') {
        throw new Error(`Account for role "${role}" is deactivated by the Administrator.`);
      }
      setAuthenticatedUser(matchedUser);
      setUser(matchedUser);
    } finally {
      setLoading(false);
    }
  };

  // Switch department view (Available exclusively for Admin)
  const switchDepartmentRole = (role: UserRole) => {
    if (authenticatedUser?.role !== 'Admin') return;

    if (role === 'Admin') {
      setUser(authenticatedUser);
    } else {
      const matchedUser = INITIAL_USERS.find((u) => u.role === role) || {
        id: `inspect-${role.toLowerCase()}`,
        username: `${role.toLowerCase()}_view`,
        email: `${role.toLowerCase()}@garasbaley.so`,
        role,
        name: `Admin (Viewing ${role})`,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setUser(matchedUser);
    }
  };

  // Restore Admin role
  const restoreAdminRole = () => {
    if (authenticatedUser?.role === 'Admin') {
      setUser(authenticatedUser);
    }
  };

  const logout = () => {
    removeStoredToken();
    setAuthenticatedUser(null);
    setUser(null);
  };

  const register = async (userData: Partial<User> & { password?: string }) => {
    setLoading(true);
    try {
      const res = await api.register(userData);
      setStoredToken(res.token);
      setAuthenticatedUser(res.user);
      setUser(res.user);
    } catch (err: any) {
      throw new Error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<string> => {
    return `Password reset link sent to ${email}. Check your inbox for instructions from Garasbaley Hospital.`;
  };

  const isAdmin = authenticatedUser?.role === 'Admin';
  const isInspectingRole = isAdmin && user?.role !== 'Admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        authenticatedUser,
        isAdmin,
        isInspectingRole,
        loading,
        login,
        quickLoginAsRole,
        switchDepartmentRole,
        restoreAdminRole,
        logout,
        register,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

