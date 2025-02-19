const verifyEmailTemplate = (name, verificationLink) => `
  <h1>Hola ${name},</h1>
  <p>Gracias por registrarte. Por favor, verifica tu correo electrónico haciendo clic en el siguiente enlace:</p>
  <a href="${verificationLink}" style="background-color: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Verificar Email</a>
  <p>Si no solicitaste esto, ignora este mensaje.</p>
`;

module.exports = verifyEmailTemplate;
