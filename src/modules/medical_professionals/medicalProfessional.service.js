const medicalProfessionalRepository = require('./medicalProfessional.repository');
const professionalImagesService = require('../medical_professionals_image/medical_professionals_image.service');
const userService = require('../users/user.service');
const medicalSpecialtiesService = require('../medical_specialties/medical_specialties.service'); 
const { ValidationError, NotFoundError } = require('../../core/errors');
const professionalAvailabilityService = require('./professionalAvailability/professionalAvailability.service'); 



const enrichProfessionalWithData = async (professional) => {
  try {
    const image = await professionalImagesService.getProfessionalImageById(professional.id);

    let scheduleInfo = {
      type: professional.schedule_type || 'UNAVAILABLE',
      description: 'Agenda no disponible',
      isBookable: false
    };

    switch(professional.schedule_type) {
      case 'ONLINE':
        scheduleInfo.description = 'Agenda en línea disponible';
        scheduleInfo.isBookable = true;
        break;
      case 'MANUAL':
        scheduleInfo.description = 'Agenda manual';
        scheduleInfo.isBookable = false;
        break;
      default:
        break;
    }

    return { ...professional, image, scheduleInfo  };
  } catch (error) {
    return professional;
  }
};

const updateProfessionalScheduleType = async (id, scheduleType) => {
  const professional = await medicalProfessionalRepository.findMedicalProfessionalById(id);
  if (!professional) {
    throw new NotFoundError('Profesional médico no encontrado');
  }
  
  const updatedProfessional = await medicalProfessionalRepository.updateProfessionalScheduleType(id, scheduleType);
  return { ...updatedProfessional };
};



const getMedicalProfessionalById = async (id) => {
  const professional = await medicalProfessionalRepository.findMedicalProfessionalById(id);
  if (!professional) {
    return null;
  }
  return professional;
};  

const getMedicalProfessionalByUserId = async (user_id) => {
  const professional = await medicalProfessionalRepository.findMedicalProfessionalByUserId(user_id);
  if (!professional) {
    throw new NotFoundError('Profesional médico no encontrado para el usuario');
  }
  return professional;
};

const getAll = async () => {
  const professionals = await medicalProfessionalRepository.getAll();
  if (!professionals || professionals.length === 0) {
      return [];
  }

  return await Promise.all(
      professionals.map(async (professional) => {
          const enrichedProfessional = await enrichProfessionalWithData(professional);
          const user = await userService.getUserById(professional.user_id);
          const weeklyAvailability = await professionalAvailabilityService.getWeeklyAvailability(professional.id);

          return {
              ...enrichedProfessional,
              user: user ? {
                  id: user.id,
                  first_name: user.first_name,
                  last_name: user.last_name,
                  email: user.email,
                  phone: user.phone
              } : null,
              availability: weeklyAvailability 
          };
      })
  );
}; 


const createMedicalProfessional = async (professionalData) => {
  // Validar que el usuario no tenga ya registrado un profesional
  const existingProfessional = await medicalProfessionalRepository.findMedicalProfessionalByUserId(professionalData.user_id);
  if (existingProfessional) {
    throw new ValidationError('El usuario ya tiene un profesional médico registrado.');
  }

  professionalData.created_at = new Date();

  const newProfessional = await medicalProfessionalRepository.createMedicalProfessional(professionalData);
 
  return { ...newProfessional };
};

const updateMedicalProfessional = async (id, professionalData) => {
  const professional = await medicalProfessionalRepository.findMedicalProfessionalById(id);
  if (!professional) {
    throw new NotFoundError('Profesional médico no encontrado');
  }

  const updatedProfessional = await medicalProfessionalRepository.updateMedicalProfessional(id, professionalData);

  return { ...updatedProfessional };
};

const deleteMedicalProfessional = async (id) => {
  const professional = await medicalProfessionalRepository.findMedicalProfessionalById(id);
  if (!professional) {
    throw new NotFoundError('Profesional médico no encontrado');
  }
  await medicalProfessionalRepository.deleteMedicalProfessional(id);
  return { message: 'Profesional médico eliminado correctamente' };
};


const getMedicalProfessionalsBySpecialtyId = async (specialtyId) => {
  const professionals = await medicalProfessionalRepository.getMedicalProfessionalsBySpecialtyId(specialtyId);
  if (!professionals || professionals.length === 0) {
      return [];
  }

  const specialty = await medicalSpecialtiesService.getMedicalSpecialtyById(specialtyId);
  if (!specialty) {
      return [];
  }

  return await Promise.all(
      professionals.map(async (professional) => {
          const enrichedProfessional = await enrichProfessionalWithData(professional);
          const user = await userService.getUserById(professional.user_id);
          const weeklyAvailability = await professionalAvailabilityService.getWeeklyAvailability(professional.id);

          return {
              ...enrichedProfessional,
              user: user ? {
                  id: user.id,
                  first_name: user.first_name,
                  last_name: user.last_name,
                  email: user.email,
                  phone: user.phone
              } : null,
              specialty_name: specialty.name,
              availability: weeklyAvailability 
          };
      })
  );
};

const getProfessionalsByScheduleType = async (scheduleType) => {
  const professionals = await medicalProfessionalRepository.getProfessionalsByScheduleType(scheduleType);
  
  if (!professionals || professionals.length === 0) {
    return [];
  }

  return await Promise.all(
    professionals.map(async (professional) => {
      const enrichedProfessional = await enrichProfessionalWithData(professional);
      const user = await userService.getUserById(professional.user_id);
      const weeklyAvailability = await professionalAvailabilityService.getWeeklyAvailability(professional.id);

      return {
        ...enrichedProfessional,
        user: user ? {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone
        } : null,
        availability: weeklyAvailability
      };
    })
  );
};


module.exports = {
  getMedicalProfessionalById,
  getMedicalProfessionalByUserId,
  createMedicalProfessional,
  updateMedicalProfessional,
  deleteMedicalProfessional,
  getAll,
  getMedicalProfessionalsBySpecialtyId,
  enrichProfessionalWithData,
  updateProfessionalScheduleType,
  getProfessionalsByScheduleType
};
