# 📦 Módulos del Sistema

Este documento describe los principales módulos que componen el sistema Beneficiate, explicando su funcionalidad, estructura y relaciones con otros módulos.

## Estructura General de Módulos

Cada módulo sigue una estructura consistente que facilita su mantenimiento y comprensión:

```
📂 [nombre_módulo]
 ┣ 📜 [módulo].controller.js    # Controladores para manejar peticiones HTTP
 ┣ 📜 [módulo].repository.js    # Acceso a datos y operaciones en la base de datos
 ┣ 📜 [módulo].routes.js        # Definición de rutas del módulo
 ┣ 📜 [módulo].service.js       # Lógica de negocio
 ┣ 📜 [módulo].validation.js    # Esquemas de validación con Joi
```

## Módulos Principales

### Usuarios y Autenticación (`auth` y `users`)

El módulo de autenticación maneja todo el proceso de registro, inicio de sesión, verificación de identidad y gestión de tokens.

#### Funcionalidades Clave
- Registro y validación de usuarios
- Autenticación con tokens JWT
- Verificación de correo electrónico
- Recuperación de contraseña
- Gestión de tokens de actualización
- Actualización de datos de perfil

#### Componentes Importantes
- **Validación de Datos**: Esquemas Joi para validación de entrada
- **Hashing de Contraseñas**: bcrypt para almacenamiento seguro
- **Generación de Tokens**: Tokens JWT con diferentes propósitos
- **Notificaciones por Email**: Envío de correos de verificación/recuperación

#### Ejemplo de Flujo de Autenticación

```javascript
// auth.service.js
const login = async (email, password) => {
  // Validar credenciales
  const user = await authRepository.findByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new UnauthorizedError('Credenciales Inválidas');
  }

  // Verificar si el usuario ha verificado su correo
  if (!user.verified) {
    throw new UnauthorizedError('Por favor verifica tu correo electrónico');
  }

  // Generar tokens
  const accessToken = jwt.generateAccessToken({
    id: user.id,
    email: user.email,
    isAgent: isAgent,
    agentActive: agentActive,
  });
  
  const refreshToken = jwt.generateRefreshToken({
    id: user.id,
    email: user.email,
  });

  // Almacenar refresh token
  await authRepository.saveRefreshToken(user.id, refreshToken);

  return { accessToken, refreshToken };
};
```

### Beneficiarios (`beneficiaries`)

Este módulo gestiona la información de los beneficiarios asociados a un usuario principal, incluyendo sus datos personales y médicos.

#### Funcionalidades Clave
- Creación y administración de beneficiarios
- Gestión de datos médicos (vacunas, alergias, medicamentos, etc.)
- Historial médico y familiar
- Registro de enfermedades y discapacidades
- Administración de imágenes de perfil

#### Estructura de Datos de Salud
El módulo incluye varios submódulos para gestionar aspectos específicos de la salud:
- `allergies`: Alergias del beneficiario
- `disabilities`: Discapacidades registradas
- `diseases`: Enfermedades diagnosticadas
- `distinctives`: Características distintivas físicas
- `family_history`: Antecedentes familiares
- `medical_history`: Historial médico personal
- `medications`: Medicamentos prescritos
- `vaccinations`: Registro de vacunas

#### Ejemplo de Creación de Beneficiario

```javascript
// beneficiary.service.js
const createBeneficiary = async (beneficiaryData) => {
  // Validar plan del usuario
  const userPlan = await userService.getUserById(beneficiaryData.user_id);
  if (!userPlan.plan_id) {
    throw new ValidationError('El usuario no tiene un plan activo');
  }

  const plan = await planService.getPlanById(userPlan.plan_id);

  // Verificar límites del plan
  if (plan.code === PLAN_TYPES.FAMILY) {
    const beneficiaryCount = await beneficiaryRepository.countByUserId(
      beneficiaryData.user_id
    );
    if (beneficiaryCount >= 4) {
      throw new ValidationError('No puedes agregar más de 4 beneficiarios.');
    }
  } else if (plan.code === PLAN_TYPES.INDIVIDUAL) {
    throw new ValidationError(
      'No puedes agregar beneficiarios. Por favor, actualiza tu plan.'
    );
  }

  // Crear beneficiario
  beneficiaryData.removed = false;
  beneficiaryData.created_at = new Date();

  const newBeneficiary = await beneficiaryRepository.createBeneficiary(
    beneficiaryData
  );

  // Procesar imagen si existe
  if (beneficiaryData.base_64) {
    await processImage(
      newBeneficiary.id,
      beneficiaryData.public_name,
      beneficiaryData.base_64
    );
  }

  // Obtener datos adicionales
  const location = await townshipRepository.findLocationByTownshipId(
    newBeneficiary.city_id
  );
  const image = await imageRepository.getImagesByBeneficiary(newBeneficiary.id);

  return { ...newBeneficiary, location, image };
};
```

### Citas Médicas (`appointment`)

Este módulo gestiona todo el ciclo de vida de las citas médicas, desde la programación hasta el seguimiento.

#### Funcionalidades Clave
- Creación y programación de citas
- Gestión de estados (pendiente, confirmada, cancelada, etc.)
- Notificaciones automáticas de citas
- Filtrado y búsqueda de citas
- Tarea programada para expirar citas antiguas

#### Estados de Citas
- `PENDING`: Cita creada pero pendiente de confirmación
- `CONFIRMED`: Cita confirmada por el sistema o agente
- `CANCELLED`: Cita cancelada
- `RESCHEDULED`: Cita reprogramada para otra fecha/hora
- `TO_BE_CONFIRMED`: Cita en espera de confirmación telefónica
- `COMPLETED`: Cita realizada exitosamente
- `EXPIRED`: Cita vencida por tiempo

#### Manejo de Notificaciones
El sistema envía automáticamente notificaciones por WhatsApp:
- Al confirmar cita
- Al cancelar cita
- Al reprogramar cita
- Como recordatorio previo a la cita

#### Ejemplo de Confirmación de Cita

```javascript
// appointment.service.js
const updateAppointmentStatus = async (id, status) => {
  const appointment = await appointmentRepository.getAppointment(id);
  if (!appointment) {
    throw new NotFoundError('Cita no encontrada');
  }

  const updatedAppointment = await appointmentRepository.updateAppointment(id, {
    status,
  });

  // Notificar al paciente si se ha cambiado el estado
  if (appointment.status !== status) {
    try {
      // Obtener datos del doctor
      const doctor = await professionalService.getMedicalProfessionalById(
        updatedAppointment.professional_id
      );
      const doctorUser = await userService.getUserById(doctor.user_id);
      const doctorName = `${doctorUser?.first_name} ${doctorUser?.last_name}`;
      
      // Formatear fecha y hora
      const date = formatAppointmentDate(updatedAppointment.appointment_date);
      const time = formatAppointmentTime(updatedAppointment.appointment_time);
      
      // Enviar notificación según el nuevo estado
      if (status === 'CONFIRMED') {
        // Código para enviar confirmación por WhatsApp
        await WhatsAppService.sendMessage(
          userPhone,
          generateConfirmationMessage(doctorName, date, time, user.first_name)
        );
      } else if (status === 'CANCELLED') {
        // Enviar notificación de cancelación
        await WhatsAppService.sendMessage(
          userPhone,
          generateCancellationMessage(doctorName, date, user.first_name)
        );
      }
    } catch (notificationError) {
      console.error('Error al enviar notificaciones:', notificationError);
    }
  }

  return updatedAppointment;
};
```

### Profesionales Médicos (`medical_professionals`)

Este módulo gestiona la información de los profesionales médicos, sus especialidades, disponibilidad y programación.

#### Funcionalidades Clave
- Registro y administración de perfiles de profesionales
- Gestión de especialidades médicas
- Configuración de horarios de disponibilidad
- Agendamiento de citas
- Asignación de profesionales a especialidades

#### Tipos de Agenda
- `ONLINE`: Disponible para agendamiento en línea
- `MANUAL`: Requiere contacto para programar cita
- `UNAVAILABLE`: No disponible temporalmente

#### Ejemplo de Obtención de Disponibilidad

```javascript
// professionalAvailability.service.js
const getWeeklyAvailability = async (professionalId) => {
    const availability = await professionalAvailabilityRepository.getAvailabilityByProfessionalId(professionalId);

    if (!availability.length) {
        throw new NotFoundError('No hay disponibilidad registrada para este profesional.');
    }

    const today = moment(); // Día actual
    const daysOfWeek = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    const structuredAvailability = {};
    availability.forEach(slot => {
        const dayIndex = daysOfWeek.indexOf(slot.day_of_week);
        if (dayIndex === -1) return;

        let nextAvailableDate = today.clone().isoWeekday(dayIndex);

        // Si el día ya pasó en la semana, moverlo a la siguiente semana
        if (nextAvailableDate.isBefore(today, 'day')) {
            nextAvailableDate.add(1, 'week');
        }

        const dayNumber = nextAvailableDate.date();
        const monthName = months[nextAvailableDate.month()];
        const currentMonth = today.month();
        const formattedDate = (nextAvailableDate.month() !== currentMonth)
            ? `${slot.day_of_week} ${dayNumber} de ${monthName}`
            : `${slot.day_of_week} ${dayNumber}`;

        structuredAvailability[slot.day_of_week] = {
            start: slot.start_time,
            end: slot.end_time,
            date: nextAvailableDate.format("YYYY-MM-DD"),
            formatted_date: formattedDate
        };
    });

    return structuredAvailability;
};
```

### Pagos y Planes (`payments` y `plans`)

Este módulo gestiona los planes de suscripción, procesamiento de pagos y transacciones financieras.

#### Funcionalidades Clave
- Gestión de planes de suscripción
- Integración con Wompi para procesamiento de pagos
- Generación de enlaces de pago
- Procesamiento de webhooks de confirmanción
- Historial de transacciones
- Validación de integridad en pagos

#### Tipos de Planes
- `FAMILY`: Plan familiar con hasta 4 beneficiarios
- `INDIVIDUAL`: Plan individual sin beneficiarios

#### Ejemplo de Procesamiento de Pago

```javascript
// wompi.payment.service.js
const createPaymentTransaction = async (amount, currency, userId, planId, userEmail) => {
  try {
    // Validar que el plan exista
    const planInfo = await this.getPlanDetails(planId);
    
    if (!planInfo) {
      throw new PaymentError('El plan seleccionado no existe');
    }

    // Parsear el precio correctamente
    const cleanPrice = planInfo.price.toString().replace(/\./g, '').replace(/,/g, '');
    const priceInCents = parseInt(cleanPrice);

    // Crear referencia única
    const reference = `plan_${planId}_${userId}_${Date.now()}`;

    // Payload para Wompi
    const payload = {
      name: `Plan ${planInfo.name}`,
      description: planInfo.description || `Suscripción al plan ${planInfo.name}`,
      single_use: true,
      currency,
      amount_in_cents: priceInCents,
      redirect_url: process.env.WOMPI_REDIRECT_URL,
      expires_at: this.getExpirationDate(),
      collect_shipping: false,
      sku: `PLAN-${planId}`,
      customs: [
        { key: 'user_id', value: userId.toString() },
        { key: 'plan_id', value: planId.toString() },
        { key: 'email', value: userEmail },
      ],
    };

    // Enviar solicitud a Wompi
    const response = await axios.post(
      `${this.wompiBaseUrl}/payment_links`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${this.wompiPrivateKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Extraer ID de transacción
    const transactionId = response.data.data?.id || response.data.id;

    // Guardar transacción en base de datos
    await this.saveTransactionLog(
      userId,
      planId,
      transactionId,
      planInfo.price,
      reference,
      planInfo.name,
      currency
    );

    // Extraer URL de pago
    const checkoutUrl = response.data.data?.url || `https://checkout.wompi.co/l/${transactionId}`;

    return {
      id: transactionId,
      data: { checkout_url: checkoutUrl },
    };
  } catch (error) {
    console.error('Error creando transacción:', error);
    throw new PaymentError('No se pudo crear la transacción de pago');
  }
};
```

### Chat y Comunicación (`chat` y `agent_chat`)

Este módulo gestiona la comunicación en tiempo real entre usuarios y agentes de atención al cliente.

#### Funcionalidades Clave
- Chat en tiempo real mediante WebSockets
- Sistema de chat para agentes de call center
- Chatbot para agendamiento de citas
- Historial de conversaciones
- Notificaciones de mensajes nuevos

#### Tipos de Participantes
- `USER`: Usuario regular del sistema
- `AGENT`: Agente de atención al cliente
- `SYSTEM`: Mensajes automáticos del sistema

#### Ejemplo de Manejo de Websockets

```javascript
// websocket.js
const initializeWebSocket = (server) => {
  const wss = new WebSocket.Server({ noServer: true });

  server.on('upgrade', async (request, socket, head) => {
    // Verificación de token JWT
    let token = request.headers['sec-websocket-protocol'];
    if (!token) {
      socket.destroy();
      return;
    }
    token = token.split(', ')[1] || token;
    
    try {
      const decodedToken = jwt.verifyToken(token, process.env.JWT_SECRET);
      if (!decodedToken || !decodedToken.id) {
        socket.destroy();
        return;
      }

      // Obtener datos actualizados del usuario
      const userData = await userRepository.getUserById(decodedToken.id);
      if (!userData) {
        socket.destroy();
        return;
      }

      // Verificar si es agente
      let isAgent = false;
      let agentData = null;
      
      try {
        agentData = await callCenterAgentService.getCallCenterAgentByUserId(userData.id);
        if (agentData) {
          isAgent = true;
          agentActive = agentData.status === 'ACTIVE';
        }
      } catch (error) {
        isAgent = false;
      }

      // Añadir datos a la solicitud
      const user = {
        ...userData,
        isAgent,
        agentActive,
        agentId: agentData?.id || null,
      };

      request.user = user;
      
      // Completar la conexión WebSocket
      wss.handleUpgrade(request, socket, head, (ws) => {
        ws.user = user;
        wss.emit('connection', ws, request);
      });
    } catch (error) {
      socket.destroy();
    }
  });

  // Manejo de la conexión establecida
  wss.on('connection', async (ws, req) => {
    // Código para manejar la conexión...
  });
};
```

### Ubicaciones (`township`)

Este módulo gestiona la información geográfica (departamentos, ciudades) para la ubicación de usuarios y profesionales.

#### Funcionalidades Clave
- Consulta de departamentos
- Consulta de municipios/ciudades por departamento
- Validación de ubicaciones
- Localización de profesionales médicos

#### Ejemplo de Consulta de Municipios

```javascript
// township.service.js
const getTownshipsByDepartment = async (department_id) => {
  if (!department_id) {
    throw new ValidationError('El ID del departamento es obligatorio');
  }

  const townships = await townshipRepository.findTownshipsByDepartmentId(department_id);
  if (!townships.length) {
    throw new ValidationError('No se encontraron municipios para este departamento');
  }

  return townships;
};
```

### Notificaciones (`twilio`)

Este módulo gestiona el envío de notificaciones por WhatsApp, SMS y correo electrónico.

#### Funcionalidades Clave
- Envío de mensajes por WhatsApp
- Envío de mensajes por SMS
- Plantillas predefinidas para diferentes tipos de notificaciones
- Registro de mensajes enviados
- Verificación de estado de entrega

#### Ejemplo de Envío de Notificación

```javascript
// twilio.service.js
const sendWhatsAppMessage = async (to, message, options = {}) => {
  const normalizedNumber = this.normalizePhoneNumber(to);

  if (!normalizedNumber) {
    console.warn('⚠️ Número de teléfono no válido. WhatsApp no enviado.');
    return {
      success: false,
      error: 'Número de teléfono no proporcionado o inválido.',
    };
  }

  try {
    const formattedTo = `whatsapp:+${normalizedNumber}`;
    let messageOptions = {
      from: TWILIO_WHATSAPP_NUMBER,
      to: formattedTo,
    };

    // Verificar si es un mensaje de plantilla o texto simple
    if (typeof message === 'object' && message.template) {
      // Configuración para plantilla de WhatsApp
      const templateSids = {
        appointment_confirmation: 'HX269d1b223840809f9bfdf9a799dd349b',
        appointment_cancellation: 'HX7dcddfb72ea3a705236902bf78d5c5b0',
        appointment_rescheduled: 'HX05b96adfded6908089bc2aa61f3d9af8',
        appointment_reminder: 'HX3865468f6c551637a849c18c80796a89',
      };

      messageOptions.contentSid = templateSids[message.template];
      messageOptions.contentVariables = JSON.stringify(
        this.formatTemplateVariables(message.components)
      );
    } else {
      messageOptions.body = message;
      
      // Añadir media si existe
      if (options.mediaUrl) {
        messageOptions.mediaUrl = options.mediaUrl;
      }
    }

    // Enviar mensaje
    const response = await this.client.messages.create(messageOptions);
    
    // Registrar el envío
    await this.logMessageSent(
      normalizedNumber,
      'WHATSAPP',
      typeof message === 'object' ? `Template: ${message.template}` : message,
      response.sid,
      response.status
    );

    return { success: true, sid: response.sid, status: response.status };
  } catch (error) {
    console.error('❌ Error enviando mensaje de WhatsApp:', error);
    
    // Registrar el error
    await this.logMessageError(
      normalizedNumber,
      'WHATSAPP',
      typeof message === 'object' ? `Template: ${message.template}` : message,
      error.message
    );

    return { success: false, error: error.message, details: error };
  }
};
```

## Interrelaciones Entre Módulos

Los módulos del sistema interactúan entre sí para crear un ecosistema coherente:

1. `users` ↔ `beneficiaries`: Los usuarios pueden tener múltiples beneficiarios asociados
2. `users`/`beneficiaries` ↔ `appointment`: Citas médicas para usuarios o beneficiarios
3. `appointment` ↔ `medical_professionals`: Las citas están asociadas a profesionales
4. `users` ↔ `payment`/`plans`: Los usuarios se suscriben a planes mediante pagos
5. `users`/`beneficiaries` ↔ `chat`: Los usuarios pueden iniciar conversaciones
6. `chat` ↔ `agent_chat`: Comunicación entre usuarios y agentes
7. `appointment` ↔ `twilio`: Notificaciones automáticas sobre citas

Esta estructura modular favorece:
- **Bajo acoplamiento**: Los módulos tienen dependencias mínimas
- **Alta cohesión**: Cada módulo gestiona una responsabilidad específica
- **Escalabilidad**: Es fácil añadir nuevas características sin afectar las existentes
- **Mantenibilidad**: Los problemas se pueden aislar y solucionar por módulos específicos