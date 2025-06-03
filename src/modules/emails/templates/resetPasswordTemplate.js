// src/modules/emails/resetPasswordTemplate.js
const resetPasswordTemplate = (name, resetLink) => 
  `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restablecimiento de Contraseña</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #007bff;
      color: white;
      padding: 20px;
      text-align: center;
    }
    .content {
      padding: 20px;
      background-color: #f9f9f9;
      border: 1px solid #dddddd;
    }
    .button {
      display: inline-block;
      background-color: #007bff;
      color: white;
      padding: 10px 20px;
      margin: 20px 0;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
    }
    .footer {
      margin-top: 20px;
      text-align: center;
      font-size: 12px;
      color: #777777;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Restablecimiento de Contraseña</h1>
    </div>
    <div class="content">
      <p>Hola ${name},</p>
      <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
      <p style="text-align: center;">
        <a href="${resetLink}" class="button">Restablecer Contraseña</a>
      </p>
      <p>Este enlace expirará en 1 hora por razones de seguridad.</p>
      <p>Si no has solicitado cambiar tu contraseña, puedes ignorar este mensaje y tu contraseña seguirá siendo la misma.</p>
      <p>Saludos,<br>El equipo de soporte</p>
    </div>
    <div class="footer">
      <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
    </div>
  </div>
</body>
</html>
`;

module.exports = resetPasswordTemplate;