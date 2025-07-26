// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  
  // Check if it's a Supabase error
  if (err.code && err.details) {
    return res.status(400).json({
      error: err.message,
      details: err.details
    });
  }
  
  // Default error response
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
};

module.exports = errorHandler;
