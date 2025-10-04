const authRoutes = require('./auth');
const jobRoutes = require('./jobs');
const browseRoutes = require('./browse');
const messageRoutes = require('./messages');
const reviewRoutes = require('./reviews');
const adminRoutes = require('./admin');

module.exports = {
  authRoutes,
  jobRoutes,
  browseRoutes,
  messageRoutes,
  reviewRoutes,
  adminRoutes
};