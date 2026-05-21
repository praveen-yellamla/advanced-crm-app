const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getEmailThreads,
  getThreadById
} = require('../controllers/emailController');

router.use(protect);

router.get('/', getEmailThreads);
router.get('/:id', getThreadById);

module.exports = router;
