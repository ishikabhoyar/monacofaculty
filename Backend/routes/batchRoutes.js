const express = require('express');
const router = express.Router();
const { createBatch, getBatches, getBatchById, updateBatch, deleteBatch } = require('../controllers/batchController');
const auth = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(auth);

// Route: POST /api/batches - Create a new batch
router.post('/', createBatch);

// Route: GET /api/batches - Get all batches for the authenticated faculty
router.get('/', getBatches);

// Route: GET /api/batches/:id - Get a specific batch by ID
router.get('/:id', getBatchById);

// Route: PUT /api/batches/:id - Update a batch
router.put('/:id', updateBatch);

// Route: DELETE /api/batches/:id - Delete a batch
router.delete('/:id', deleteBatch);

module.exports = router;
