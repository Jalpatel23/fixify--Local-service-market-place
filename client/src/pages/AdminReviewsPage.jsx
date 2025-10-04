import React from 'react';
import { AdminLayout, ReviewModeration } from '../components/Admin';

const AdminReviewsPage = () => {
  return (
    <AdminLayout activeSection="reviews">
      <ReviewModeration />
    </AdminLayout>
  );
};

export default AdminReviewsPage; 