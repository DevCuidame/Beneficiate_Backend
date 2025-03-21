// src/modules/emails/doctorInterestTemplate.js

// ------------ Template para el correo con la información del médico interesado en trabajar con la empresa ------------ //

const workEmailTemplate = (doctorForm) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interés en Trabajar con Nosotros</title>
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
      background-color: #28a745;
      color: white;
      padding: 20px;
      text-align: center;
    }
    .content {
      padding: 20px;
      background-color: #f9f9f9;
      border: 1px solid #dddddd;
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
      <h1>Interés en Trabajar con Nosotros</h1>
    </div>
    <div class="content">
      <p>Estimado equipo,</p>
      <p>Tenemos un médico interesado en unirse a nuestro equipo. A continuación, los detalles proporcionados:</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td><strong>Nombre:</strong></td>
          <td>${doctorForm.first_name} ${doctorForm.last_name}</td>
        </tr>
        <tr>
          <td><strong>Tipo de identificación:</strong></td>
          <td>${doctorForm.identification_type}</td>
        </tr>
        <tr>
          <td><strong>Número de identificación:</strong></td>
          <td>${doctorForm.identification_number}</td>
        </tr>
        <tr>
          <td><strong>Dirección:</strong></td>
          <td>${doctorForm.address}</td>
        </tr>
        <tr>
          <td><strong>Ciudad:</strong></td>
          <td>${doctorForm.city}</td>
        </tr>
        <tr>
          <td><strong>Departamento:</strong></td>
          <td>${doctorForm.department}</td>
        </tr>
        <tr>
          <td><strong>Género:</strong></td>
          <td>${doctorForm.gender}</td>
        </tr>
        <tr>
          <td><strong>Teléfono:</strong></td>
          <td>${doctorForm.phone}</td>
        </tr>
        <tr>
          <td><strong>Correo electrónico:</strong></td>
          <td>${doctorForm.email}</td>
        </tr>
      </table>
      <p>Por favor, tómate el tiempo de revisar la información. Si estás interesado en continuar con el proceso, no dudes en ponerte en contacto con el equipo de recursos humanos.</p>
      <p>Saludos,<br>El equipo de soporte</p>
    </div>
    <div class="footer">
      <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
    </div>
  </div>
</body>
</html>
`;

module.exports = workEmailTemplate;