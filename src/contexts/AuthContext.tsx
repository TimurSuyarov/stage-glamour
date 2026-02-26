import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'executor' | 'validator' | 'returner';

interface User {
  id: string;
  name: string;
  role: UserRole;
  employeeId: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  hasPermission: (module: string, action: string) => boolean;
}

// RBAC Permissions Matrix
const permissions: Record<UserRole, Record<string, string[]>> = {
  executor: {
    admission: ['create', 'edit', 'view'],
    order: ['manage', 'view'],
    collect: ['manage', 'view'],
    validation: ['view'],
    return: [],
    masterData: ['view'],
    move: ['initiate', 'view'],
    relocation: ['initiate', 'view'],
    history: ['view'],
    warehouse: ['view'],
    employees: ['view'],
    cells: ['view'],
    goods: ['view'],
    inventory: ['view'],
    reports: ['view'],
  },
  validator: {
    admission: ['view'],
    order: ['view'],
    collect: ['view'],
    validation: ['approve', 'reject', 'view'],
    return: [],
    masterData: ['view'],
    move: [],
    relocation: [],
    history: ['view'],
    warehouse: ['view'],
    employees: ['view'],
    cells: ['view'],
    goods: ['view'],
    inventory: ['view'],
    reports: ['view'],
  },
  returner: {
    admission: [],
    order: ['view'],
    collect: [],
    validation: [],
    return: ['manage', 'create', 'edit', 'view'],
    masterData: ['view'],
    move: [],
    relocation: [],
    history: ['view'],
    warehouse: ['view'],
    employees: ['view'],
    cells: ['view'],
    goods: ['view'],
    inventory: ['view'],
    reports: ['view'],
  },
};

// Menu visibility based on role
export const menuVisibility: Record<UserRole, string[]> = {
  executor: [
    'dashboard', 'admission', 'order', 'requiredStockTransfer', 'collect', 'validation', 
    'moveToRegion', 'relocation', 'return', 'history', 'warehouse', 
    'employees', 'cells', 'goods', 'inventory', 'reports', 'bonuses'
  ],
  validator: [
    'dashboard', 'admission', 'order', 'requiredStockTransfer', 'collect', 'validation', 
    'return', 'history', 'warehouse', 'employees', 'cells', 'goods', 
    'inventory', 'reports'
  ],
  returner: [
    'dashboard', 'order', 'requiredStockTransfer', 'return', 'history', 'warehouse', 
    'employees', 'cells', 'goods', 'inventory', 'reports'
  ],
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>({
    id: '1',
    name: 'Admin User',
    role: 'executor',
    employeeId: 'EMP-001',
  });

  const hasPermission = (module: string, action: string): boolean => {
    if (!user) return false;
    const rolePermissions = permissions[user.role];
    const modulePermissions = rolePermissions[module];
    if (!modulePermissions) return false;
    return modulePermissions.includes(action) || modulePermissions.includes('manage');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
