import React from 'react';
import { AdminLayout, JobModeration } from '../components/Admin';

const AdminJobsPage = () => {
  return (
    <AdminLayout activeSection="jobs">
      <JobModeration />
    </AdminLayout>
  );
};

export default AdminJobsPage; 