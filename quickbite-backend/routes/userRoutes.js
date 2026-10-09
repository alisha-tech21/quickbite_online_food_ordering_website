const express = require('express');
const router = express.Router();
const { updateMyProfile, addAddress, updateAddress, deleteAddress } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.put('/me', updateMyProfile);
router.post('/me/addresses', addAddress);
router.put('/me/addresses/:addressId', updateAddress);
router.delete('/me/addresses/:addressId', deleteAddress);

module.exports = router;
