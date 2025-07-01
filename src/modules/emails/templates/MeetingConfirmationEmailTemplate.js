const meetingConfirmationEmailTemplate = (meetForm) => `
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300..700&family=Raleway:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
    <title>Confirmación de Cita Médica</title>
    <style>
      * {
        font-family: "Quicksand", sans-serif;
      }
      body {
        margin: 0;
        padding: 0;
        background-color: #f5f5f5;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
      }
      .header {
        background-color: #4eaa03;
        color: white;
        padding: 15px;
        display: flex;
        justify-content: center;
      }
      .header .logo {
        width: 175px;
      }
      .info-contain {
        padding: 1.5rem 20px;
      }
      .welcome-text {
        font-size: 20px;
        font-weight: bold;
        margin-top: -25px;
        color: #192a54;
      }
      .description {
        color: #192a54;
        line-height: 1.5;
        margin-bottom: 20px;
      }
      .benefits {
        margin-bottom: 15px;
      }
      .benefit-item {
        display: flex;
        margin-bottom: 10px;
        color: #192a54;
      }
      .benefit-icon {
        background-color: #00d26a;
        color: white;
        margin-right: 10px;
        padding: 1px 5px;
        border-radius: 8px;
        font-weight: bold;
      }
      .footer {
        background-color: #192a54;
        color: white;
        padding: 20px;
        text-align: center;
      }
      .social-media {
        max-height: 5rem;
        margin: 15px 20%;
        padding: 0 5%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border: 1px solid #e8d641;
        border-radius: 15px;
      }
      .social-icons {
        display: flex;
      }
      .social-icon img {
        width: 50px;
        margin: 5px 10px;
      }
      .cta-button {
        display: block;
        background-color: #e8d641;
        color: #192a54;
        text-align: center;
        padding: 15px;
        text-decoration: none;
        font-size: 1.5rem;
        font-weight: bold;
        border-radius: 15px;
        margin: 20px auto;
        width: 65%;
      }
      .logo-footer {
        margin-top: 25px;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        font-weight: bold;
        font-size: 15px;
      }
      .logo-footer h6 {
        margin: 0;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img class="hero-image" alt="Logo" src="https://api.beneficiate.co/uploads/static/b_logo.png" />
      </div>

      <div class="content">
        <div class="info-contain">
          <div class="welcome-text">¡Tu cita ha sido confirmada!</div>

          <p class="description">
            Hola ${meetForm.userData.first_name}, tu cita médica ha sido agendada exitosamente. 
            Aquí tienes los detalles:
          </p>

          <div class="benefits">
            <div class="benefit-item">
              <span class="benefit-icon">✓</span>
              <span>Especialidad: ${meetForm.specialty}</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">✓</span>
              <span>Fecha y hora: ${meetForm.appointment_date}, ${meetForm.appointment_time}</span>
            </div>
          </div>

          <p class="description">
            Por favor llega unos minutos antes de tu cita. Estamos para servirte.
          </p>

          <p class="description">¡Te esperamos!</p>

          <p class="description">El equipo de <strong>Benefíciate</strong></p>
        </div>
      </div>

      <div class="footer">
        <div class="social-media">
          <h3>Síguenos</h3>
          <div class="social-icons">
            <a href="https://www.instagram.com/beneficiate.oficial" class="social-icon">
              <img class="logo" alt="Instagram" src="https://api.beneficiate.co/uploads/static/insta.png" />
            </a>
            <a href="https://www.facebook.com/beneficiateco" class="social-icon">
              <img class="logo" alt="Facebook" src="https://api.beneficiate.co/uploads/static/facebook.png" />
            </a>
          </div>
        </div>

        <a href="https://beneficiate.co/desktop" class="cta-button">Ir a la app</a>

        <br />

        <div class="logo-footer">
          <img class="logo" alt="Logo" style="width: 125px;" src="https://api.beneficiate.co/uploads/static/beneficiate_foot.png" />
          <h6>PRIVILEGIOS PLUS SAS</h6>
          <h6>NIT: 901327625</h6>
        </div>
      </div>
    </div>
  </body>
</html>
`;

module.exports = meetingConfirmationEmailTemplate;