const jwt = require('jsonwebtoken');
require('dotenv').config();

const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' }); 
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' }); 
};

const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};


const generateVerificationToken = (user) => {
  return jwt.sign(
    { email: user.email },
    process.env.JWT_VERIFICATION_SECRET,
    '1h' 
  );
};

module.exports = { generateAccessToken, generateRefreshToken, verifyToken, generateVerificationToken };
