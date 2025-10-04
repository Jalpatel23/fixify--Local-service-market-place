import React from 'react';
import { AdminLayout, AdminDashboard } from '../components/Admin';

const AdminPage = () => {
  return (
    <AdminLayout activeSection="dashboard">
      <AdminDashboard />
    </AdminLayout>
  );
};

export default AdminPage; 