const testConnection = async () => {
    try {
      await transporter.verify();
      console.log('Conexión exitosa al servidor de correo');
    } catch (error) {
      console.error('Error al conectar con el servidor de correo:', error);
    }
  };
  
  testConnection();