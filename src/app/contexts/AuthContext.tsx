"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { syncLogin } from '@/lib/sync-client';

interface User {
  id: string;
  username: string;
  storeName?: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string, storeName?: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const foundUser = users.find(
      (u: any) => u.username === username && u.password === password
    );

    if (foundUser) {
      const userData = {
        id: foundUser.id,
        username: foundUser.username,
        storeName: foundUser.storeName,
      };
      setUser(userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      try {
        const syncSession = await syncLogin(username, password);
        if (syncSession?.token) {
          localStorage.setItem('syncToken', syncSession.token);
          localStorage.setItem('syncUserId', syncSession.userId);
        }
      } catch (error) {
        console.error('Sync login failed', error);
      }
      return true;
    }
    return false;
  };

  const register = async (
    username: string,
    password: string,
    storeName?: string
  ): Promise<boolean> => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Check if username already exists
    if (users.some((u: any) => u.username === username)) {
      return false;
    }

    const newUser = {
      id: Date.now().toString(),
      username,
      password,
      storeName,
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    const userData = {
      id: newUser.id,
      username: newUser.username,
      storeName: newUser.storeName,
    };
    setUser(userData);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    try {
      const syncSession = await syncLogin(username, password);
      if (syncSession?.token) {
        localStorage.setItem('syncToken', syncSession.token);
        localStorage.setItem('syncUserId', syncSession.userId);
      }
    } catch (error) {
      console.error('Sync login failed', error);
    }
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('syncToken');
    localStorage.removeItem('syncUserId');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
