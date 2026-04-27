const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('CLIENT'));

router.get('/dashboard', clientController.getClientDashboard);
router.get('/companies', clientController.getClientCompanies);
router.post('/companies', clientController.createCompany);
router.get('/leads', clientController.getClientLeads);
router.get('/tickets', clientController.getClientTickets);
router.post('/tickets', clientController.createTicket);

module.exports = router;
