const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getEmailTemplates,
  createEmailTemplate
} = require('../controllers/emailController');

router.use(protect);

router.get('/', getEmailTemplates);
router.post('/', createEmailTemplate);

module.exports = router;
