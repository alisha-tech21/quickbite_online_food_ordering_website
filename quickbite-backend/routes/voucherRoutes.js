const express = require('express');
const router = express.Router();
const { getActiveVouchers, applyVoucher } = require('../controllers/voucherController');
const { protect } = require('../middleware/authMiddleware');

router.get('/active', getActiveVouchers);
router.post('/apply', protect, applyVoucher);

module.exports = router;
