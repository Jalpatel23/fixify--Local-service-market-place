const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const {
  advancedSearch,
  searchSuggestions,
  getSearchFilters,
  searchValidation
} = require('../controllers/searchController');

// Search routes
router.get('/jobs', authenticateUser, searchValidation, advancedSearch);
router.get('/suggestions', searchSuggestions);
router.get('/filters', getSearchFilters);

module.exports = router; 