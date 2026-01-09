
import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/Store.tsx';
import Login from './pages/Login.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Attendance from './pages/Attendance.tsx';
import Leave from './pages/Leave.tsx';
import Employees from './pages/Employees.tsx';
import Reports from './pages/Reports.tsx';
import Positions from './pages/Positions.tsx';
import Departments from './pages/Departments.tsx';
import Shifts from './pages/Shifts.tsx';
import Locations from './pages/Locations.tsx';
import Holidays from './pages/Holidays.tsx';
import Layout from './components/Layout.tsx';

const AppRoutes = () => {
  const { isAuthenticated } = useStore();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard onNavigate={setCurrentPage} />;
      case 'attendance': return <Attendance />;
      case 'leaves': return <Leave />;
      case 'employees': return <Employees />;
      case 'reports': return <Reports />;
      case 'positions': return <Positions />;
      case 'departments': return <Departments />;
      case 'shifts': return <Shifts />;
      case 'locations': return <Locations />;
      case 'holidays': return <Holidays />;
      default: return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <Layout activePage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
};

const App = () => {
  return (
    <StoreProvider>
      <AppRoutes />
    </StoreProvider>
  );
};

export default App;
