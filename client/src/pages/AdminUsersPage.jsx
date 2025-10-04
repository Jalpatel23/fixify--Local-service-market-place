import React from 'react';
import { AdminLayout, UserManagement } from '../components/Admin';

const AdminUsersPage = () => {
  return (
    <AdminLayout activeSection="users">
      <UserManagement />
    </AdminLayout>
  );
};

export default AdminUsersPage; 