import React from 'react';
import { AdminLayout, AdminSettings } from '../components/Admin';

const AdminSettingsPage = () => {
  return (
    <AdminLayout activeSection="settings">
      <AdminSettings />
    </AdminLayout>
  );
};

export default AdminSettingsPage; 