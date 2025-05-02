# 🏛️ Arquitectura del Sistema

## Resumen

Beneficiate implementa una **arquitectura limpia** (Clean Architecture) que separa claramente las responsabilidades en capas bien definidas para garantizar escalabilidad, mantenibilidad y facilidad de pruebas.

## Diagrama de Arquitectura

```
┌────────────────────────┐      ┌───────────────────────────┐
│  Capa de Presentación  │◄─────┤  Servicios Externos       │
│  (API / WebSockets)    │      │  (Twilio, Wompi, Email)   │
└───────────┬────────────┘      └───────────────────────────┘
            │
            ▼
┌────────────────────────┐
│  Capa de Servicios     │
│  (Lógica de Negocio)   │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐      ┌───────────────────────────┐
│  Capa de Repositorios  │◄─────┤  Base de Datos            │
│  (Acceso a Datos)      │      │  (PostgreSQL)             │
└────────────────────────┘      └───────────────────────────┘
```

## Capas de la Arquitectura

### 1. Capa de Presentación (API)
- **Responsabilidad**: Gestionar las interacciones con clientes externos.
- **Componentes**:
  - **Rutas (routes)**: Definen los endpoints de la API.
  - **Controladores (controllers)**: Manejan las peticiones HTTP y las respuestas.
  - **Middlewares**: Procesamiento intermedio (autenticación, validación).
  - **WebSockets**: Comunicación en tiempo real.

### 2. Capa de Servicios
- **Responsabilidad**: Encapsular la lógica de negocio de la aplicación.
- **Componentes**:
  - **Servicios**: Coordinan operaciones complejas y flujos de trabajo.
  - **Validación de Negocio**: Garantizan la integridad de las operaciones.
  - **Transformación de Datos**: Adaptan datos entre capas.

### 3. Capa de Repositorios
- **Responsabilidad**: Acceso y manipulación de datos persistentes.
- **Componentes**:
  - **Repositorios**: Abstraen operaciones CRUD sobre entidades específicas.
  - **Consultas SQL**: Interacción directa con la base de datos.
  - **Cache**: Optimización de acceso a datos frecuentes.

### 4. Capa de Utilidades
- **Responsabilidad**: Proporcionar funcionalidades transversales.
- **Componentes**:
  - **Utilidades de Fecha**: Formateo y manipulación de fechas/horas.
  - **Utilidades de JWT**: Generación y verificación de tokens.
  - **Utilidades de Imagen**: Procesamiento de imágenes subidas.
  - **Gestión de Errores**: Estructura para manejo consistente de errores.

## Patrones de Diseño Implementados

### Patrón Repositorio
Separa la lógica de acceso a datos de la lógica de negocio, permitiendo cambiar la implementación de almacenamiento sin afectar las capas superiores.

**Ejemplo**:
```javascript
// user.repository.js
const findByEmail = async (email) => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
};
```

### Patrón Servicio
Encapsula la lógica de negocio en servicios que coordinan operaciones complejas.

**Ejemplo**:
```javascript
// appointment.service.js
const createAppointment = async (appointmentData) => {
  const { user_id, beneficiary_id, specialty_id } = appointmentData;
  
  // Validación de negocio
  const user = await userService.getUserById(user_id);
  if (!user || !user.plan_id) {
    throw new ValidationError('El usuario no tiene un plan activo');
  }
  
  // Llamada al repositorio
  const appointment = await appointmentRepository.createAppointment(appointmentData);
  
  return formatDatesInData(appointment, ['appointment_date']);
};
```

### Middleware
Intercepta y procesa las peticiones antes de que lleguen a los controladores o después de procesarlas.

**Ejemplo**:
```javascript
// auth.middleware.js
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Token no proporcionado o formato incorrecto'));
  }

  const token = authHeader.split(' ')[1];

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    return next(new UnauthorizedError('Error en la autenticación'));
  }
};
```

### Patrón Observador (para WebSockets)
Implementa un sistema basado en eventos donde cambios en un objeto notifican a sus suscriptores.

**Ejemplo**:
```javascript
// websocket-events.js
const eventHandlers = new Map();

const on = (eventName, handler) => {
  if (!eventHandlers.has(eventName)) {
    eventHandlers.set(eventName, []);
  }
  eventHandlers.get(eventName).push(handler);
};

const emit = (eventName, data) => {
  const handlers = eventHandlers.get(eventName);
  if (handlers && handlers.length > 0) {
    handlers.forEach(handler => handler(data));
  }
};
```

## Integración con Servicios Externos

### Twilio (Mensajería)
Servicio para enviar notificaciones por SMS y WhatsApp.

```javascript
// twilio.service.js
const sendWhatsAppMessage = async (to, message) => {
  const formattedTo = `whatsapp:+${normalizedNumber}`;
  const response = await twilioClient.messages.create({
    from: TWILIO_WHATSAPP_NUMBER,
    to: formattedTo,
    body: message
  });
  
  return { success: true, sid: response.sid };
};
```

### Wompi (Pagos)
Procesamiento seguro de pagos y suscripciones.

```javascript
// wompi.payment.service.js
const createPaymentTransaction = async (amount, currency, userId, planId, userEmail) => {
  const payload = {
    name: `Plan ${planInfo.name}`,
    currency,
    amount_in_cents: priceInCents,
    redirect_url: process.env.WOMPI_REDIRECT_URL,
    // ...otros parámetros
  };

  const response = await axios.post(`${this.wompiBaseUrl}/payment_links`, payload, {
    headers: { Authorization: `Bearer ${this.wompiPrivateKey}` }
  });
  
  return {
    id: response.data.data.id,
    data: { checkout_url: response.data.data.url }
  };
};
```

### Nodemailer (Correo Electrónico)
Envío de correos para verificación, recuperación de contraseña y notificaciones.

```javascript
// emailConf.js
const transporter = nodemailer.createTransport({
  host: 'webmail.beneficiate.co', 
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false }
});
```

## Base de Datos

La aplicación utiliza PostgreSQL como sistema de gestión de base de datos relacional, con un esquema cuidadosamente diseñado para manejar:

- Usuarios y perfiles
- Beneficiarios y sus datos médicos
- Citas médicas y agendamiento
- Profesionales médicos y especialidades
- Transacciones y planes de salud
- Chats y comunicaciones

## Organización de Código por Módulos

Cada módulo funcional tiene su propia estructura de archivos:

```
📂 modules
 ┣ 📂 users                # Gestión de usuarios
 ┣ 📂 beneficiaries        # Beneficiarios y dependientes
 ┣ 📂 appointment          # Citas médicas
 ┣ 📂 medical_professionals # Profesionales médicos
 ┣ 📂 payment              # Procesamiento de pagos
 ┣ 📂 auth                 # Autenticación y autorización
 ┣ 📂 chat                 # Sistema de chat
 ┗ 📂 ...                  # Otros módulos
```

Esta organización basada en capacidades empresariales facilita el trabajo en equipo, permitiendo que diferentes desarrolladores trabajen en módulos distintos con mínimas interferencias.

## Conclusiones

La arquitectura de Beneficiate se ha diseñado para:

1. **Separación de Responsabilidades**: Cada componente tiene una función clara y específica.
2. **Facilidad de Mantenimiento**: La modularidad permite modificar partes sin afectar al conjunto.
3. **Escalabilidad**: Nuevas funcionalidades pueden añadirse con mínimo impacto.
4. **Testabilidad**: La inyección de dependencias facilita las pruebas unitarias e integración.
5. **Robustez**: El manejo consistente de errores mejora la experiencia del usuario.
