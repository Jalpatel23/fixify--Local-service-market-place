import React from 'react';
import { AdminLayout, AnalyticsDashboard } from '../components/Admin';

const AdminAnalyticsPage = () => {
  return (
    <AdminLayout activeSection="analytics">
      <AnalyticsDashboard />
    </AdminLayout>
  );
};

export default AdminAnalyticsPage; 