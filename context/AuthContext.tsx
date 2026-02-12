import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import api from '../services/api';

interface AuthContextType {
  userToken: string | null;
  userRole: string | null;
  userName: string | null;
  userEmail: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Placeholder for fetchMe function as requested in login logic
  const fetchMe = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data) {
        setUserRole(res.data.role);
        setUserName(res.data.name);
        setUserEmail(res.data.email);
        await AsyncStorage.setItem('userRole', res.data.role);
        // await AsyncStorage.setItem('userName', res.data.name); // Optional persistence if needed
        // await AsyncStorage.setItem('userEmail', res.data.email);
      }
    } catch (e) {
      console.log('Error fetching user details:', e);
    }
  };

  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const role = await AsyncStorage.getItem('userRole');
        const name = await AsyncStorage.getItem('userName');
        const email = await AsyncStorage.getItem('userEmail');

        if (token) {
          setUserToken(token);
          if (role) setUserRole(role);
          if (name) setUserName(name);
          if (email) setUserEmail(email);
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          await fetchMe();
        }
      } catch (e) {
        console.error("Auth Load Error:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadToken();
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      const res = await api.post("/auth/login", { email, password: pass });
      const token = res.data?.token;

      const user = res.data?.user || res.data;
      const role = user?.role || res.data?.role;
      const name = user?.name;
      const userEmailVal = user?.email;

      if (token) {
        setUserToken(token);
        await AsyncStorage.setItem('userToken', token);
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        if (role) {
          setUserRole(role);
          await AsyncStorage.setItem('userRole', role);
        }

        if (name) {
          setUserName(name);
          await AsyncStorage.setItem('userName', name);
        }

        if (userEmailVal) {
          setUserEmail(userEmailVal);
          await AsyncStorage.setItem('userEmail', userEmailVal);
        }

        if (!role || !name || !userEmailVal) {
          await fetchMe();
        }

        return true;
      }
      return false;
    } catch (e: any) {
      console.error(e.response?.data || e.message);
      return false;
    }
  };

  const logout = async () => {
    setUserToken(null);
    setUserRole(null);
    setUserName(null);
    setUserEmail(null);
    delete api.defaults.headers.common["Authorization"];
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userRole');
    await AsyncStorage.removeItem('userName');
    await AsyncStorage.removeItem('userEmail');
  };

  return (
    <AuthContext.Provider value={{ userToken, userRole, userName, userEmail, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};