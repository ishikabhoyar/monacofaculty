const express = require('express');
const router = express.Router();
const authMiddleware = require('../authMiddleware');

// This is a protected route
router.get('/', authMiddleware, (req, res) => {
  res.json({ message: 'This is the tests route.', user: req.user });
});

module.exports = router;