# 🔄 API Endpoints

Este documento detalla todos los endpoints disponibles en la API de Beneficiate, junto con los parámetros requeridos, respuestas esperadas y ejemplos de uso.

## Formato de Respuesta

Todas las respuestas de la API siguen un formato estándar:

### Respuesta Exitosa
```json
{
  "message": "Mensaje descriptivo",
  "data": { /* datos de respuesta */ },
  "statusCode": 200
}
```

### Respuesta de Error
```json
{
  "error": "Descripción del error",
  "statusCode": 400,
  "timestamp": "2023-04-23T15:30:45.123Z"
}
```

## Autenticación

Todas las rutas protegidas requieren un encabezado de autorización:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 🔓 Rutas Públicas

#### `POST /api/v1/auth/login`
Inicia sesión y obtiene token de autenticación.

**Cuerpo de la solicitud:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}
```

**Respuesta exitosa:**
```json
{
  "message": "Login exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 123,
      "email": "usuario@ejemplo.com",
      "first_name": "Nombre",
      "last_name": "Apellido",
      // Otros datos del usuario
    },
    "beneficiaries": [
      // Lista de beneficiarios si existen
    ]
  },
  "statusCode": 200
}
```

#### `POST /api/v1/auth/register`
Registra un nuevo usuario.

**Cuerpo de la solicitud:**
```json
{
  "first_name": "Nombre",
  "last_name": "Apellido",
  "identification_type": "CC",
  "identification_number": "1234567890",
  "address": "Dirección completa",
  "city_id": 1,
  "phone": "3001234567",
  "birth_date": "1990-01-01",
  "gender": "M",
  "email": "usuario@ejemplo.com",
  "password": "contraseña123",
  "privacy_policy": true
}
```

**Respuesta exitosa:**
```json
{
  "message": "Usuario registrado exitosamente",
  "data": {
    "id": 123,
    "email": "usuario@ejemplo.com",
    "first_name": "Nombre",
    // Otros datos del usuario
  },
  "statusCode": 201
}
```

#### `GET /api/v1/auth/verify-email`
Verifica la dirección de correo electrónico a través de token enviado por email.

**Parámetros de consulta:**
```
?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### `POST /api/v1/auth/refresh-token`
Renueva el token de acceso utilizando el token de actualización.

**Cuerpo de la solicitud:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### `POST /api/v1/password/request-reset`
Solicita restablecer la contraseña.

**Cuerpo de la solicitud:**
```json
{
  "email": "usuario@ejemplo.com"
}
```

#### `POST /api/v1/password/reset`
Restablece la contraseña utilizando un token.

**Cuerpo de la solicitud:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "nueva_contraseña123",
  "confirmPassword": "nueva_contraseña123"
}
```

### 🔒 Rutas Protegidas (Requieren Autenticación)

#### `GET /api/v1/user/id/:id`
Obtiene información detallada de un usuario por su ID.

**Respuesta exitosa:**
```json
{
  "message": "Usuario recuperado exitosamente",
  "data": {
    "id": 123,
    "first_name": "Nombre",
    "last_name": "Apellido",
    "email": "usuario@ejemplo.com",
    // Otros datos del usuario
    "plan": {
      "id": 1,
      "name": "Plan Familiar",
      // Detalles del plan
    },
    "image": {
      // Datos de imagen si existe
    },
    "location": {
      // Datos de ubicación
    }
  },
  "statusCode": 200
}
```

#### `PUT /api/v1/user/update/:id`
Actualiza la información de un usuario.

**Cuerpo de la solicitud:**
```json
{
  "first_name": "Nuevo Nombre",
  "last_name": "Nuevo Apellido",
  "phone": "3009876543",
  // Otros campos a actualizar
}
```

#### `GET /api/v1/beneficiary/user/:user_id`
Obtiene todos los beneficiarios de un usuario.

**Respuesta exitosa:**
```json
{
  "message": "Beneficiarios recuperados exitosamente",
  "data": [
    {
      "id": 456,
      "first_name": "Nombre Beneficiario",
      "last_name": "Apellido Beneficiario",
      // Datos del beneficiario
      "image": {
        // Datos de imagen si existe
      },
      "vaccinations": [
        // Lista de vacunas
      ],
      "allergies": [
        // Lista de alergias
      ]
      // Otros datos de salud
    }
    // Más beneficiarios
  ],
  "statusCode": 200
}
```

#### `POST /api/v1/beneficiary/create`
Crea un nuevo beneficiario.

**Cuerpo de la solicitud:**
```json
{
  "user_id": 123,
  "first_name": "Nombre Beneficiario",
  "last_name": "Apellido Beneficiario",
  "identification_type": "TI",
  "identification_number": "9876543210",
  "phone": "3001234567",
  "birth_date": "2010-05-15",
  "gender": "F",
  "city_id": 1,
  "address": "Dirección del beneficiario",
  "blood_type": "O+",
  "health_provider": "EPS Ejemplo"
}
```

#### `PUT /api/v1/beneficiary/update/:id`
Actualiza los datos de un beneficiario.

#### `DELETE /api/v1/beneficiary/remove/:id`
Elimina un beneficiario.

## Citas Médicas

#### `POST /api/v1/medical-appointment/create`
Crea una nueva cita médica.

**Cuerpo de la solicitud:**
```json
{
  "user_id": 123,
  "beneficiary_id": 456, // null si es para el usuario principal
  "specialty_id": 2,
  "professional_id": 789,
  "appointment_date": "2023-05-10",
  "appointment_time": "14:30:00",
  "duration_minutes": 30,
  "status": "PENDING",
  "notes": "Primera consulta",
  "is_for_beneficiary": true,
  "first_time": true,
  "control": false,
  "city_id": 1
}
```

#### `GET /api/v1/medical-appointment/:id`
Obtiene detalles de una cita específica.

#### `PUT /api/v1/medical-appointment/update/:id`
Actualiza una cita médica.

#### `PUT /api/v1/medical-appointment/status/:id`
Actualiza el estado de una cita (confirmar, cancelar, reprogramar).

**Cuerpo de la solicitud:**
```json
{
  "status": "CONFIRMED" // O "CANCELLED", "RESCHEDULED", etc.
}
```

#### `GET /api/v1/medical-appointment/user/:user_id`
Obtiene todas las citas del usuario.

## Profesionales Médicos

#### `GET /api/v1/medical-professionals/all`
Obtiene todos los profesionales médicos.

#### `GET /api/v1/medical-professionals/id/:id`
Obtiene información detallada de un profesional médico.

#### `GET /api/v1/medical-professionals/specialty/:specialty_id`
Obtiene todos los profesionales médicos de una especialidad específica.

## Especialidades Médicas

#### `GET /api/v1/medical-specialties/all`
Obtiene todas las especialidades médicas disponibles.

**Respuesta exitosa:**
```json
{
  "message": "Especialidades recuperadas exitosamente",
  "data": [
    {
      "id": 1,
      "name": "Cardiología",
      "description": "Especialidad en enfermedades del corazón",
      "image_path": "/uploads/specialties/cardiology.jpg"
    },
    {
      "id": 2,
      "name": "Pediatría",
      "description": "Especialidad en niños y adolescentes",
      "image_path": "/uploads/specialties/pediatrics.jpg"
    }
    // Más especialidades
  ],
  "statusCode": 200
}
```

## Pagos y Planes

#### `GET /api/v1/plans/all`
Obtiene todos los planes disponibles.

#### `POST /api/v1/payments/create`
Crea una transacción de pago.

**Cuerpo de la solicitud:**
```json
{
  "planId": 1
}
```

**Respuesta exitosa:**
```json
{
  "message": "Transacción creada exitosamente",
  "data": {
    "transactionId": "wompi_trans_123",
    "publicKey": "pub_test_key...",
    "redirectUrl": "https://checkout.wompi.co/l/wompi_trans_123"
  },
  "statusCode": 200
}
```

#### `GET /api/v1/payments/verify-details/:transactionId`
Verifica el estado de una transacción.

#### `POST /api/v1/payments/webhook/wompi`
Webhook para recibir actualizaciones de pagos desde Wompi.

## Chat y Comunicación

#### `POST /api/v1/agent-chat/initiate`
Inicia un nuevo chat con un agente.

**Cuerpo de la solicitud:**
```json
{
  "agent_id": 789,
  "user_id": 123
}
```

#### `POST /api/v1/agent-chat/send-message`
Envía un mensaje en un chat.

**Cuerpo de la solicitud:**
```json
{
  "chat_id": 456,
  "sender_id": 123,
  "sender_type": "USER", // O "AGENT"
  "message": "Hola, necesito ayuda con mi cita"
}
```

#### `GET /api/v1/agent-chat/messages/:chat_id`
Obtiene los mensajes de un chat específico.

#### `POST /api/v1/agent-chat/close`
Cierra un chat activo.

**Cuerpo de la solicitud:**
```json
{
  "chat_id": 456,
  "closed_by": 123
}
```

## Ubicaciones

#### `GET /api/v1/townships/departments`
Obtiene la lista de departamentos.

#### `GET /api/v1/townships/:departmentId`
Obtiene la lista de municipios/ciudades por departamento.

## Datos de Salud del Beneficiario

#### `POST /api/v1/beneficiary/health-data/create`
Crea o actualiza datos de salud para un beneficiario.

**Cuerpo de la solicitud:**
```json
{
  "diseases": [
    {
      "beneficiary_id": 456,
      "disease": "Asma",
      "diagnosed_date": "2018-03-15",
      "treatment_required": true
    }
  ],
  "disabilities": [
    {
      "beneficiary_id": 456,
      "name": "Discapacidad visual parcial"
    }
  ],
  "distinctives": [
    {
      "beneficiary_id": 456,
      "description": "Cicatriz en brazo derecho"
    }
  ]
}
```

#### `POST /api/v1/beneficiary/allergies-medications/create`
Crea o actualiza alergias y medicamentos para un beneficiario.

#### `POST /api/v1/beneficiary/vaccinations/create`
Crea o actualiza vacunas para un beneficiario.

## Ejemplos de Código

### Iniciar Sesión y Obtener Token

```javascript
// Ejemplo con fetch
const login = async (email, password) => {
  try {
    const response = await fetch('https://api.beneficiate.co/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Error al iniciar sesión');
    }
    
    // Guardar tokens
    localStorage.setItem('accessToken', data.data.token);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    
    return data.data;
  } catch (error) {
    console.error('Error de inicio de sesión:', error);
    throw error;
  }
};
```

### Obtener Citas de un Usuario

```javascript
// Ejemplo con axios
const getUserAppointments = async (userId) => {
  try {
    const token = localStorage.getItem('accessToken');
    
    const response = await axios.get(
      `https://api.beneficiate.co/api/v1/medical-appointment/user/${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return response.data.data;
  } catch (error) {
    console.error('Error al obtener citas:', error);
    
    // Si es error de token expirado, intentar renovar
    if (error.response?.status === 401) {
      await refreshAccessToken();
      return getUserAppointments(userId);
    }
    
    throw error;
  }
};
```

### Crear un Nuevo Beneficiario

```javascript
// Ejemplo con fetch
const createBeneficiary = async (beneficiaryData) => {
  try {
    const token = localStorage.getItem('accessToken');
    
    const response = await fetch('https://api.beneficiate.co/api/v1/beneficiary/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(beneficiaryData)
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Error al crear beneficiario');
    }
    
    return data.data;
  } catch (error) {
    console.error('Error al crear beneficiario:', error);
    throw error;
  }
};
```

## Códigos de Estado HTTP

- `200 OK`: Solicitud exitosa
- `201 Created`: Recurso creado exitosamente
- `400 Bad Request`: Error de validación en los datos enviados
- `401 Unauthorized`: Error de autenticación (token inválido/expirado)
- `403 Forbidden`: El usuario no tiene permisos para el recurso
- `404 Not Found`: Recurso no encontrado
- `500 Internal Server Error`: Error del servidor