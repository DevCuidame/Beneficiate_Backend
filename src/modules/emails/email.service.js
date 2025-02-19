const transporter = require('../../utils/emailConf');
const verifyEmailTemplate = require('./verifyEmailTemplate');

const sendVerificationEmail = async (user, verificationToken) => {
  const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'Verifica tu cuenta',
    html: verifyEmailTemplate(user.first_name, verificationLink),
  };

  await transporter.sendMail(mailOptions);
};


module.exports = { sendVerificationEmail };
