const express = require('express');
const router = express.Router();
const SlotController = require('../../controllers/user_controller/slotController');

router.get('/available', SlotController.getAvailableSlots);
router.post('/:studentId/book/:slotId', SlotController.bookSlot);

module.exports = router;