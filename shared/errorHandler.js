// Express global error middleware — registered via app.use() in server.js
function errorHandler(err, req, res, next) {
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred';
  console.error(`[ERROR] ${new Date().toISOString()} | ${req.method} ${req.url} | Status: ${statusCode}`, err);
  res.status(statusCode).json({ success: false, status: statusCode, message });
}

// Utility for controllers and routes that catch errors themselves
function handleError(res, err, statusCode = 500, message = 'An unexpected error occurred') {
  console.error(`[ERROR] ${new Date().toISOString()} | Status: ${statusCode} | ${message}`, err);
  return res.status(statusCode).json({ success: false, status: statusCode, message });
}

export { handleError };
export default errorHandler;
