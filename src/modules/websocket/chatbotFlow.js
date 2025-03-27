const userRepository = require('../users/user.repository');
const appointmentService = require('../appointment/appointment.service');
const medicalSpecialtiesService = require('../medical_specialties/medical_specialties.service');
const beneficiaryRepository = require('../beneficiaries/beneficiary.repository');
const townshipRepository = require('../township/township.repository');
const townshipService = require('../township/township.service');

const STATES = {
  AWAITING_DOCUMENT: 'awaiting_document',
  AWAITING_CITY_SELECTION: 'awaiting_city_selection',
  AWAITING_SPECIALTY_SEARCH: 'awaiting_specialty_search',
  AWAITING_SPECIALTY_SELECTION: 'awaiting_specialty_selection',
  AWAITING_CONSULT_REASON: 'awaiting_consult_reason',
  AWAITING_DESCRIPTION: 'awaiting_description',
  CONFIRMATION: 'confirmation',
  COMPLETED: 'completed',
};

async function validateDocument(document, userId) {
  if (!document || document.length < 6) {
    return { valid: false, error: 'Documento inválido o incompleto.' };
  }

  const user = await userRepository.getUserByIdNum(document);
  const beneficiary = await beneficiaryRepository.findByIdentification(
    document
  );

  if (user && user.identification_number === document) {
    const belongsTo = `${user.first_name.split(' ')[0]} ${
      user.last_name.split(' ')[0]
    }`;
    return { 
      valid: true, 
      belongsTo, 
      type: 'user', 
      id: user.id,
      city_id: user.city_id 
    };
  }

  if (beneficiary) {
    if (beneficiary.user_id !== userId) {
      return {
        valid: false,
        error: 'Solo puede agendar citas para sus propios beneficiarios.',
      };
    }
    
    const belongsTo = `${beneficiary.first_name.split(' ')[0]} ${
      beneficiary.last_name.split(' ')[0]
    }`;
    return { 
      valid: true, 
      belongsTo, 
      type: 'beneficiary', 
      id: beneficiary.id,
      city_id: beneficiary.city_id
    };
  }

  return {
    valid: false,
    error: 'El documento no coincide con nuestros registros. Intenta de nuevo.',
  };
}

function sendMessage(ws, message) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

// Función para buscar ciudades que coinciden con un término de búsqueda
async function searchCities(searchTerm) {
  try {
    // Obtener todas las ciudades primero
    const allDepartments = await townshipService.getAllDepartments();
    let allCities = [];
    
    // Para cada departamento, obtener sus ciudades
    for (const department of allDepartments) {
      const cities = await townshipService.getTownshipsByDepartment(department.id);
      allCities = [...allCities, ...cities];
    }
    
    // Filtrar las ciudades que coinciden con el término de búsqueda
    if (!searchTerm || searchTerm.trim() === '') {
      return allCities.slice(0, 10); // Limitar a 10 resultados si no hay término de búsqueda
    }
    
    const normalizedSearchTerm = searchTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    return allCities
      .filter(city => {
        const normalizedCityName = city.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return normalizedCityName.includes(normalizedSearchTerm);
      })
      .slice(0, 10); // Limitar a 10 resultados máximo
  } catch (error) {
    console.error('Error buscando ciudades:', error);
    return [];
  }
}

// Función para buscar especialidades que coinciden con un término de búsqueda
async function searchSpecialties(searchTerm) {
  try {
    const allSpecialties = await medicalSpecialtiesService.getAll();
    
    if (!searchTerm || searchTerm.trim() === '') {
      return allSpecialties.slice(0, 10); // Limitar a 10 resultados si no hay término de búsqueda
    }
    
    const normalizedSearchTerm = searchTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    return allSpecialties
      .filter(specialty => {
        const normalizedSpecialtyName = specialty.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return normalizedSpecialtyName.includes(normalizedSearchTerm);
      })
      .slice(0, 10); // Limitar a 10 resultados máximo
  } catch (error) {
    console.error('Error buscando especialidades:', error);
    return [];
  }
}

async function handleChatbotFlow(ws, data) {
  try {
    if (
      (data.event && data.event === 'init') ||
      data.event === 'chatbot_init'
    ) {
      // Ya no necesitamos professionalId aquí
      if (!ws.botState) {
        ws.botState = STATES.AWAITING_DOCUMENT;
        const welcomeMsg = {
          event: 'chatbot_message',
          message:
            'Bienvenido al chat de citas. Para empezar, por favor ingresa el documento de identidad de la persona que necesita la cita, sin espacios ni puntos.',
          sender_type: 'BOT',
        };
        sendMessage(ws, welcomeMsg);
      }
      return;
    }

    console.log('Estado actual del bot:', ws.botState, 'Mensaje recibido:', data.message);

    switch (ws.botState) {
      case STATES.AWAITING_DOCUMENT: {
        const document = data.message;
        const validationResult = await validateDocument(document, ws.user.id);
        if (!validationResult.valid) {
          sendMessage(ws, {
            event: 'chatbot_message',
            message: validationResult.error,
            sender_type: 'BOT',
          });
          return;
        }

        // Almacenar información del documento validado
        ws.flowData = ws.flowData || {};
        ws.flowData.document = document;
        ws.flowData.documentBelongsTo = validationResult.belongsTo;
        ws.flowData.documentType = validationResult.type;
        ws.flowData.personId = validationResult.id;
        ws.flowData.city_id = validationResult.city_id;

        // Obtener el nombre de la ciudad actual del usuario
        let currentCity = "No especificada";
        try {
          if (validationResult.city_id) {
            const location = await townshipService.getTownshipById(validationResult.city_id);
            if (location && location.length > 0 && location[0].township_name) {
              currentCity = location[0].township_name;
            }
          }
        } catch (error) {
          console.error("Error obteniendo datos de ciudad:", error);
        }

        // Preguntar si desea cita en la ciudad actual o en otra
        sendMessage(ws, {
          event: 'chatbot_message',
          message: `Documento validado para ${validationResult.belongsTo}. ¿Desea agendar la cita en ${currentCity} o en otra ciudad?`,
          sender_type: 'BOT',
          list: true,
          options: [`En ${currentCity}`, "En otra ciudad"]
        });

        ws.botState = STATES.AWAITING_CITY_SELECTION;
        break;
      }
      case STATES.AWAITING_CITY_SELECTION: {
        const response = data.message.trim();
        ws.flowData = ws.flowData || {};
        
        // Si el usuario elige la ciudad actual
        if (response.toLowerCase().startsWith("en ") && !response.toLowerCase().includes("otra")) {
          ws.flowData.selected_city_id = ws.flowData.city_id;
          
          // Avanzar a la selección de especialidad
          sendMessage(ws, {
            event: 'chatbot_message',
            message: 'Perfecto. Ahora, por favor ingrese la especialidad médica que necesita:',
            sender_type: 'BOT',
          });
          ws.botState = STATES.AWAITING_SPECIALTY_SEARCH;
          return;
        } 
        
        // Si el usuario quiere cambiar de ciudad
        if (response.toLowerCase() === "en otra ciudad") {
          sendMessage(ws, {
            event: 'chatbot_message',
            message: 'Por favor, empiece a escribir el nombre de la ciudad deseada:',
            sender_type: 'BOT',
          });
          // Limpiar cualquier ciudad previamente seleccionada
          delete ws.flowData.selected_city_id;
          delete ws.flowData.matchingCities;
          return;
        }
        
        // Verificar si el usuario ya seleccionó una ciudad de la lista
        if (ws.flowData.matchingCities) {
          const selectedCity = ws.flowData.matchingCities.find(
            city => city.name.toLowerCase() === response.toLowerCase()
          );
          
          if (selectedCity) {
            // Guardar la ciudad seleccionada y avanzar a especialidades
            ws.flowData.selected_city_id = selectedCity.id;
            console.log("Ciudad seleccionada:", selectedCity.name, "ID:", selectedCity.id);
            
            // Limpiar las ciudades almacenadas para evitar confusiones
            delete ws.flowData.matchingCities;
            
            // Avanzar a especialidades
            sendMessage(ws, {
              event: 'chatbot_message',
              message: `Ciudad seleccionada: ${selectedCity.name}. Ahora, por favor ingrese la especialidad médica que necesita:`,
              sender_type: 'BOT',
            });
            
            ws.botState = STATES.AWAITING_SPECIALTY_SEARCH;
            return;
          }
        }
          
        // El usuario está escribiendo una ciudad, buscar coincidencias
        const matchingCities = await searchCities(response);
        
        if (matchingCities.length === 0) {
          sendMessage(ws, {
            event: 'chatbot_message',
            message: 'No se encontraron ciudades con ese nombre. Por favor, intente con otro nombre:',
            sender_type: 'BOT',
          });
          return;
        }
        
        // Mostrar opciones de ciudades
        sendMessage(ws, {
          event: 'chatbot_message',
          message: 'Seleccione una ciudad de la lista:',
          sender_type: 'BOT',
          list: true,
          options: matchingCities.map(city => city.name)
        });
        
        // Almacenar las ciudades para usarlas después
        ws.flowData.matchingCities = matchingCities;
        break;
      }
      case STATES.AWAITING_SPECIALTY_SEARCH: {
        const searchTerm = data.message.trim();
        
        // Búsqueda de especialidades
        const matchingSpecialties = await searchSpecialties(searchTerm);
        
        if (matchingSpecialties.length === 0) {
          sendMessage(ws, {
            event: 'chatbot_message',
            message: 'No se encontraron especialidades con ese nombre. Por favor, intente con otro término:',
            sender_type: 'BOT',
          });
          return;
        }
        
        // Mostrar opciones de especialidades
        sendMessage(ws, {
          event: 'chatbot_message',
          message: 'Seleccione una especialidad de la lista:',
          sender_type: 'BOT',
          list: true,
          options: matchingSpecialties.map(specialty => specialty.name)
        });
        
        // Almacenar las especialidades para usarlas después
        ws.flowData = ws.flowData || {};
        ws.flowData.matchingSpecialties = matchingSpecialties;
        ws.botState = STATES.AWAITING_SPECIALTY_SELECTION;
        break;
      }
      case STATES.AWAITING_SPECIALTY_SELECTION: {
        const selectedSpecialtyName = data.message.trim();
        
        // Proceso normal de selección de especialidad
        const selectedSpecialty = ws.flowData.matchingSpecialties.find(
          specialty => specialty.name.toLowerCase() === selectedSpecialtyName.toLowerCase()
        );
        
        if (!selectedSpecialty) {
          sendMessage(ws, {
            event: 'chatbot_message',
            message: 'La especialidad seleccionada no es válida. Por favor, seleccione una de la lista.',
            sender_type: 'BOT',
            list: true,
            options: ws.flowData.matchingSpecialties.map(s => s.name)
          });
          return;
        }
        
        // Guardar la especialidad seleccionada
        ws.flowData.specialty = selectedSpecialty.name;
        ws.flowData.specialty_id = selectedSpecialty.id;
        
        // Limpiar las especialidades almacenadas para evitar confusiones
        delete ws.flowData.matchingSpecialties;

        // Preguntar si es primera vez o control
        sendMessage(ws, {
          event: 'chatbot_message',
          message: `¿Esta cita es para primera vez o para control?`,
          sender_type: 'BOT',
          list: true,
          options: ['Primera vez', 'Control']
        });
        
        // Avanzar al estado de tipo de visita
        ws.botState = STATES.AWAITING_VISIT_TYPE;
        break;
      }
      case STATES.AWAITING_VISIT_TYPE: {
        const visitType = data.message.trim().toLowerCase();
        
        // Validar la selección del tipo de visita
        if (visitType !== 'primera vez' && visitType !== 'control') {
          sendMessage(ws, {
            event: 'chatbot_message',
            message: 'Por favor, seleccione una opción válida: Primera vez o Control',
            sender_type: 'BOT',
            list: true,
            options: ['Primera vez', 'Control']
          });
          return;
        }
        
        // Guardar el tipo de visita
        ws.flowData.first_time = (visitType === 'primera vez');
        ws.flowData.control = (visitType === 'control');

        
        sendMessage(ws, {
          event: 'chatbot_message',
          message: 'Gracias. Ahora, por favor, brinde una descripción detallada de su motivo de consulta:',
          sender_type: 'BOT',
        });
        
        ws.botState = STATES.AWAITING_DESCRIPTION;
        break;
      }
      case STATES.AWAITING_DESCRIPTION: {
        const description = data.message;
        ws.flowData = ws.flowData || {};
        ws.flowData.description = description;
        
        // Obtener nombre de la ciudad seleccionada
        let cityName = "No especificada";
        try {
          if (ws.flowData.selected_city_id) {
            const location = await townshipService.getTownshipById(ws.flowData.selected_city_id);
            if (location && location.length > 0 && location[0].township_name) {
              cityName = location[0].township_name;
            }
          }
        } catch (error) {
          console.error("Error obteniendo datos de ciudad:", error);
        }
        
        sendMessage(ws, {
          event: 'chatbot_message',
          message: `Resumen de su consulta:
- Paciente: ${ws.flowData.documentBelongsTo}
- Ciudad: ${cityName}
- Especialidad: ${ws.flowData.specialty}
- Descripción: ${description}
- Tipo de cita: ${ws.flowData.first_time ? 'Primera vez' : 'Control'}

¿Desea confirmar el agendamiento de su cita? (si/no)`,
          sender_type: 'BOT',
          list: true,
          options: ['si', 'no'],
        });
        ws.botState = STATES.CONFIRMATION;
        break;
      }
      case STATES.CONFIRMATION: {
        const confirmation = data.message.toLowerCase().trim();
        if (confirmation === 'si' || confirmation === 'sí') {
          // Preparar datos de la cita
          const appointmentData = {
            user_id: ws.user.id,
            professional_id: null, // Ya no es necesario el professional_id
            specialty_id: ws.flowData.specialty_id,
            beneficiary_id: ws.flowData.documentType === 'beneficiary' ? ws.flowData.personId : null,
            appointment_date: null, // Se asignará después
            status: 'PENDING',
            notes: `Descripción: ${ws.flowData.description}`,
            is_for_beneficiary: ws.flowData.documentType === 'beneficiary',
            city_id: ws.flowData.selected_city_id,
            first_time: ws.flowData.first_time,
            control: ws.flowData.control
          };

          console.log("Datos de la cita a guardar:", appointmentData);

          try {
            // Crear la cita pendiente
            const scheduled = await appointmentService.createPendingAppointment(appointmentData);
            
            sendMessage(ws, {
              event: 'chatbot_message',
              message: 'Su solicitud de cita ha sido registrada exitosamente. Nuestro equipo se pondrá en contacto con usted para confirmar los detalles. ¡Gracias por utilizar nuestro servicio!',
              sender_type: 'BOT',
              redirectUrl: '/home',
            });
          } catch (error) {
            console.error('Error al guardar la cita:', error);
            sendMessage(ws, {
              event: 'chatbot_message',
              message: 'Ocurrió un error al guardar su cita. Por favor, intente nuevamente más tarde.',
              sender_type: 'BOT',
            });
          }
          ws.botState = STATES.COMPLETED;
        } else if (confirmation === 'no') {
          sendMessage(ws, {
            event: 'chatbot_message',
            message: 'Entendido. Si necesita más ayuda, puede iniciar un nuevo flujo de consulta. ¡Gracias!',
            sender_type: 'BOT',
          });
          ws.botState = STATES.COMPLETED;
        } else {
          // Agregar las opciones seleccionables "si" y "no"
          sendMessage(ws, {
            event: 'chatbot_message',
            message: 'No he entendido su respuesta. Por favor, confirme si desea agendar la cita respondiendo "si" o "no".',
            sender_type: 'BOT',
            list: true,
            options: ['si', 'no'],
          });
        }
        break;
      }
      default: {
        sendMessage(ws, {
          event: 'chatbot_message',
          message: 'Ha ocurrido un error en el flujo del chatbot. Reiniciando el proceso...',
          sender_type: 'BOT',
          shouldRestartFlow: true,
        });
        ws.botState = STATES.AWAITING_DOCUMENT;
        break;
      }
    }
  } catch (error) {
    console.error('Error en el flujo del chatbot:', error);
    sendMessage(ws, {
      event: 'chatbot_message',
      message: 'Error interno, por favor intente nuevamente más tarde.',
      sender_type: 'BOT',
    });
  }
}

module.exports = {
  handleChatbotFlow,
  STATES,
};