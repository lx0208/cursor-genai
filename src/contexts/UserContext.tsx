import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { ENABLE_LOGIN, checkUserAuthenticated, redirectToLogin } from '../config/keycloak';

interface User {
  username: string;
  avatar?: string;
  roles?: string[];
  token?: string;
}

interface UserContextType {
  user: User | null;
  login: (username: string, token?: string, roles?: string[]) => void;
  logout: () => void;
  isLoggedIn: boolean;
  checkingAuth: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);

  // 用户认证状态检查
  useEffect(() => {
    const checkAuth = () => {
      // 如果未启用登录，创建默认用户
      if (!ENABLE_LOGIN) {
        setUser({
          username: 'Guest User',
          avatar: 'G',
          roles: ['user']
        });
        setCheckingAuth(false);
        return;
      }

      // 检查用户是否已登录
      const isAuthenticated = checkUserAuthenticated();
      
      if (!isAuthenticated) {
        // 如果需要登录但没有认证，重定向到登录页面
        redirectToLogin();
      } else {
        // 这里可以从session/localStorage获取用户信息
        // 目前简单设置一个默认值
        setUser({
          username: 'Authenticated User',
          avatar: 'A',
          roles: ['user']
        });
      }
      
      setCheckingAuth(false);
    };

    checkAuth();
  }, []);

  const login = (username: string, token?: string, roles?: string[]) => {
    setUser({
      username,
      avatar: username.charAt(0).toUpperCase(),
      token,
      roles
    });
  };

  const logout = () => {
    // 清除用户数据
    setUser(null);
    
    // 如果启用了登录，可以重定向到登出页面
    if (ENABLE_LOGIN) {
      // 将来实现Keycloak登出
      // window.location.href = '...'; 
    }
  };

  // 如果正在检查认证状态，显示加载状态
  if (checkingAuth) {
    return <div>Checking authentication...</div>;
  }

  return (
    <UserContext.Provider
      value={{
        user,
        login,
        logout,
        isLoggedIn: !!user,
        checkingAuth
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 