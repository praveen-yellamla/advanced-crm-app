const express = require('express');
const router = express.Router();
const { 
  createInvoice, 
  getInvoice, 
  updateInvoiceStatus, 
  getAllInvoices 
} = require('../controllers/invoiceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', authorize('ADMIN', 'MANAGER'), getAllInvoices);
router.get('/:id', getInvoice);
router.post('/', createInvoice);
router.patch('/:id/status', authorize('ADMIN', 'MANAGER'), updateInvoiceStatus);

module.exports = router;
