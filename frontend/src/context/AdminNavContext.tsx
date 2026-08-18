import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface AdminNavContextType {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openSidebar: () => void;
}

const AdminNavContext = createContext<AdminNavContextType>({
  isSidebarOpen: false,
  toggleSidebar: () => {},
  closeSidebar: () => {},
  openSidebar: () => {},
});

export function AdminNavProvider({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Automatically close mobile sidebar drawer on route navigation
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);
  const openSidebar = () => setIsSidebarOpen(true);

  return (
    <AdminNavContext.Provider value={{ isSidebarOpen, toggleSidebar, closeSidebar, openSidebar }}>
      {children}
    </AdminNavContext.Provider>
  );
}

export function useAdminNav() {
  return useContext(AdminNavContext);
}
