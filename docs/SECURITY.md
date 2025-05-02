# 🔒 Políticas de Seguridad

## Introducción

Este documento describe las políticas y medidas de seguridad implementadas en la plataforma Beneficiate para proteger los datos sensibles de usuarios, garantizar la integridad de las transacciones y prevenir accesos no autorizados.

## Autenticación y Autorización

### Sistema de JSON Web Tokens (JWT)

La aplicación implementa un sistema de autenticación basado en tokens JWT con múltiples niveles de seguridad:

#### Tokens de Acceso
- **Propósito**: Autenticar peticiones a la API
- **Duración**: 30 días (configurable en variables de entorno)
- **Contenido**: ID de usuario, email, roles/permisos
- **Almacenamiento**: Cliente (localStorage/sessionStorage)

```javascript
// Generación de token de acceso
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });
};
```

#### Tokens de Actualización (Refresh)
- **Propósito**: Renovar tokens de acceso expirados sin requerir re-autenticación
- **Duración**: 30 días
- **Contenido**: ID de usuario, email
- **Almacenamiento**: Base de datos y cliente

```javascript
// Generación de token de actualización
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
};
```

#### Tokens Especializados
- **Tokens de Verificación de Email**: Duración de 24 horas
- **Tokens de Restablecimiento de Contraseña**: Duración de 1 hora
- **Almacenamiento**: Base de datos con estado (usado/no usado)

### Middleware de Autenticación

La autenticación se implementa como middleware en Express:

```javascript
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
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('El token ha expirado'));
    } else if (error.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Token inválido'));
    } else {
      return next(new UnauthorizedError('Error en la autenticación'));
    }
  }
};
```

## Protección de Datos

### Cifrado de Contraseñas

Se utiliza la biblioteca bcrypt para el cifrado seguro de contraseñas:

```javascript
// Almacenamiento seguro de contraseñas
userData.password = await bcrypt.hash(userData.password, 10);

// Verificación de contraseñas
const validPassword = await bcrypt.compare(password, user.password);
```

Características:
- Factor de trabajo (cost factor): 10
- Función de derivación de clave: Blowfish
- Protección contra ataques de fuerza bruta y tabla arcoiris

### Sanitización y Validación de Entradas

#### Validación con Joi
Todas las entradas de usuario se validan utilizando esquemas Joi:

```javascript
const appointmentSchema = Joi.object({
  user_id: Joi.number().required().messages({
    'number.base': 'El ID del usuario es requerido',
    'any.required': 'El ID del usuario es obligatorio',
  }),
  beneficiary_id: Joi.any().optional().allow(null).messages({
    'number.base': 'El ID del beneficiario debe ser un número',
  }),
  // Más validaciones...
});
```

#### Prevención de SQL Injection
Se utilizan consultas parametrizadas en todas las operaciones de base de datos:

```javascript
// Uso seguro de parámetros
const result = await pool.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);
```

#### Validación en Múltiples Capas
- Validación en el cliente (frontend)
- Validación en la API (middleware)
- Restricciones a nivel de base de datos

### Configuración de CORS

Restricción de dominios permitidos para prevenir ataques CSRF:

```javascript
app.use(cors({
  origin: ['https://beneficiate.co', 'http://localhost:8100', 'http://localhost:8101'], 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'wompi-signature']
}));
```

### Límites para Carga de Archivos

Restricciones para prevenir ataques de denegación de servicio:

```javascript
// Límites para body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Validación de tamaño de imagen
if (buffer.length > 10 * 1024 * 1024) {
  throw new Error("La imagen supera el tamaño máximo de 10MB");
}
```

## Verificación de Identidad

### Sistema de Verificación por Correo

Los nuevos usuarios deben verificar su correo electrónico:

1. Registro de usuario con estado `verified: false`
2. Envío de email con token de verificación único
3. Al hacer clic, se valida el token y se actualiza `verified: true`
4. Los tokens tienen expiración de 24 horas

```javascript
const verifyEmail = async (token) => {
  try {
    const decoded = verifyEmailToken(token);
    const user = await userRepository.getUserById(decoded.id);
    
    if (!user) throw new ValidationError('Usuario no encontrado.');
    if (user.verified) throw new ValidationError('El correo ya ha sido verificado.');
    
    await userRepository.verifyUser(user.id);
    await userRepository.invalidateVerificationToken(user.id, token);
    
    return { success: true, message: 'Tu correo electrónico ha sido verificado exitosamente' };
  } catch (error) {
    throw new ValidationError('Token inválido o expirado.');
  }
};
```

### Recuperación Segura de Contraseña

Proceso seguro de recuperación:

1. Usuario solicita recuperación por email
2. Se genera token único con expiración de 1 hora
3. Token es almacenado en la base de datos
4. El enlace enviado contiene el token
5. Se valida el token y se permite cambiar la contraseña
6. El token se marca como usado para prevenir reuso

## Seguridad en Transacciones

### Verificación de Webhook de Wompi

Se implementa validación de firmas en webhooks de pagos:

```javascript
// Verificar firma de Wompi
const validateWompiPayment = async (transactionId, signature) => {
  // Obtener detalles de la transacción
  const transaction = await getTransactionDetails(transactionId);
  
  // Generar firma esperada
  const expectedSignature = generateSignature(transaction);
  
  // Verificar coincidencia
  const isValid = expectedSignature === signature && 
                  transaction.status === 'APPROVED';
  
  return isValid;
};

// Generar firma para validación
const generateSignature = (transaction) => {
  const signatureData = `${transaction.id}${transaction.status}${transaction.amount_in_cents}`;
  return crypto
    .createHmac('sha256', wompiPrivateKey)
    .update(signatureData)
    .digest('hex');
};
```

## Monitoreo y Auditoría

### Logs de Acciones Críticas

Se registran eventos importantes para auditoría:

```javascript
// Registro de intentos de inicio de sesión
async function logLoginAttempt(userId, status, ipAddress) {
  await pool.query(
    'INSERT INTO auth_logs (user_id, action, status, ip_address, created_at) VALUES ($1, $2, $3, $4, NOW())',
    [userId, 'LOGIN', status, ipAddress]
  );
}

// Registro de mensajes enviados
async function logMessageSent(phoneNumber, channel, message, sid, status) {
  await pool.query(
    'INSERT INTO message_logs (phone_number, channel, message, message_sid, status, sent_at) VALUES ($1, $2, $3, $4, $5, NOW())',
    [phoneNumber, channel, message, sid, status]
  );
}
```

### Sistema de Manejo de Errores

Captura y registro centralizado de errores:

```javascript
const handleErrors = (err, req, res, next) => {
  console.error(`[${err.timestamp}] ${err.message}`);
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal Server Error',
    statusCode: err.statusCode || 500,
    timestamp: err.timestamp,
  });
};
```

## Mejores Prácticas Implementadas

### Principio de Mínimo Privilegio

- Usuarios de base de datos con permisos limitados
- API con autorización basada en roles y capacidades
- Restricción de acceso a recursos basada en propiedad

### Variables de Entorno

Uso de variables de entorno para datos sensibles:

```javascript
// Ejemplo de configuración de .env
JWT_SECRET=clave_secreta_muy_compleja
TWILIO_AUTH_TOKEN=tu_token_twilio
WOMPI_PRIVATE_KEY=tu_clave_privada
```

### Caducidad de Sesiones

Gestión de estado de conexión y cierre automático de sesiones inactivas:

```javascript
// Actualizar estado en línea
onlineUsers.add(user.id);
await userRepository.updateUserStatus(user.id, true);

// Manejo de desconexión
ws.on('close', async () => {
  onlineUsers.delete(userId);
  await userRepository.updateUserStatus(userId, false);
});
```

## Checklist de Seguridad

- ✅ Autenticación robusta con JWT
- ✅ Cifrado seguro de contraseñas con bcrypt
- ✅ Verificación de email para nuevos usuarios
- ✅ Recuperación segura de contraseñas
- ✅ Sanitización de entradas de usuario
- ✅ Protección contra SQL Injection
- ✅ Configuración restrictiva de CORS
- ✅ Validación de firmas en webhooks de pago
- ✅ Límites para carga de archivos
- ✅ Logs de auditoría para acciones críticas
- ✅ Manejo centralizado de errores
- ✅ Uso de variables de entorno para secretos
- ✅ Sesiones con expiración definida
- ✅ Control de acceso basado en roles
