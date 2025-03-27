const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'mail.beneficiate.co', 
  port: 465, // estándar para SSL
  secure: true, // true para 465 (SSL)
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false 
  },
  debug: true 
});

module.exports = transporter;