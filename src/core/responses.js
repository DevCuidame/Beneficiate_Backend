// core/responses.js
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
    res.status(statusCode).json({ message, data, statusCode });
  };
  
  const errorResponse = (res, error) => {
    res.status(error.statusCode || 500).json({
      error: error.message || 'Internal Server Error',
      statusCode: error.statusCode || 500,
    });
      console.log("🚀 ~ res.status ~ error.message:", error.message)
  };
  
  module.exports = { successResponse, errorResponse };