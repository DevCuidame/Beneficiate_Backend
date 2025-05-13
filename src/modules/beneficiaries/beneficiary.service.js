const beneficiaryRepository = require('../beneficiaries/beneficiary.repository');
const { ValidationError, NotFoundError } = require('../../core/errors');
const { buildImage } = require('../../utils/image.utils');
const path = require('path');
const imageRepository = require('../images/beneficiary/beneficiary.images.repository');
const townshipRepository = require('../township/township.repository');
const PATHS = require('../../config/paths');
const { formatDatesInData } = require('../../utils/date.util');
const planService = require('../plans/plan.service');
const userService = require('../users/user.service');
const { PLAN_TYPES } = require('../../config/constants/plans');
const userRepository = require ('../users/user.repository');
const jwt = require('../../utils/jwt');

const processImage = async (beneficiaryId, publicName, base64) => {
  const { nanoid } = await import('nanoid');
  if (!base64 || !publicName) return null;

  const extension = publicName.substring(publicName.lastIndexOf('.'));
  const privateName = `BENEFICIARY_${nanoid(20)}${extension}`;
  const imagePath = path.join(PATHS.BENFICIARY_IMAGES, privateName);

  try {
    await buildImage(privateName, 'beneficiary', base64);
    const imageData = {
      beneficiary_id: beneficiaryId,
      public_name: publicName,
      private_name: privateName,
      image_path: imagePath,
    };
    return await imageRepository.saveImage(imageData);
  } catch (error) {
    throw new ValidationError('Error al guardar la imagen: ' + error.message);
  }
};

const setupBeneficiaryAccount = async (beneficiaryId, beneficiaryData) => {
  try {
    // Solo proceder si se proporciona un email
    if (!beneficiaryData.email) {
      return null;
    }

    const { nanoid } = await import('nanoid');
    const bcrypt = require('bcrypt');
    
    // Generar contraseña aleatoria
    const tempPassword = nanoid(10);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Actualizar el beneficiario con la contraseña hasheada
    await beneficiaryRepository.updateBeneficiaryPassword(beneficiaryId, hashedPassword);
    
    // Enviar correo con la contraseña temporal
    await sendBeneficiaryPasswordEmail(beneficiaryData, tempPassword);
    
    return { success: true };
  } catch (error) {
    console.error('Error al configurar cuenta de beneficiario:', error);
    throw error;
  }
};

// Función para enviar el correo con la contraseña temporal
const sendBeneficiaryPasswordEmail = async (beneficiary, tempPassword) => {
  try {
    const transporter = require('../../utils/emailConf');
    
    // Construir enlace para login
    const loginLink = `${process.env.FRONTEND_URL}/desktop/login`;
    
    // Configurar correo
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: beneficiary.email,
      subject: 'Acceso a tu cuenta de beneficiario',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Bienvenido, ${beneficiary.first_name}!</h2>
          <p>Has sido registrado como beneficiario en nuestra plataforma y ahora tienes acceso a tu cuenta.</p>
          <p>Tu contraseña temporal es: <strong>${tempPassword}</strong></p>
          <p>Por favor, usa el siguiente enlace para iniciar sesión:</p>
          <a href="${loginLink}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Iniciar Sesión</a>
          <p>Te recomendamos cambiar esta contraseña por una personal después de iniciar sesión.</p>
          <p>Si no solicitaste esta cuenta, por favor ignora este mensaje.</p>
        </div>
      `
    };

    // Enviar correo
    await transporter.sendMail(mailOptions);
    
    return { success: true };
  } catch (error) {
    console.error('Error al enviar correo con contraseña temporal:', error);
    throw new Error('No se pudo enviar el correo con la contraseña temporal');
  }
};

const getBeneficiaryByIdentification = async (identification_number) => {
  const beneficiary = await beneficiaryRepository.findByIdentification(
    identification_number
  );
  if (!beneficiary) {
    throw new NotFoundError('Beneficiario no encontrado');
  }
  return beneficiary;
};

const getBeneficiaryByUserId = async (id, user_id) => {
  const beneficiary = await beneficiaryRepository.getBeneficiaryByUserId(
    id,
    user_id
  );

  if (!beneficiary) {
    throw new NotFoundError('Beneficiario no encontrado');
  }

  return beneficiary;
};

const getBeneficiaryById = async (id) => {
  const beneficiary = await beneficiaryRepository.findById(id);

  if (!beneficiary) {
    throw new NotFoundError('Beneficiario no encontrado');
  }

  return beneficiary;
};

const countUserBeneficiaries = async (user_id) => {
  const beneficiaries = await beneficiaryRepository.countUserBeneficiaries(
    user_id
  );

  if (!beneficiaries) {
    throw new NotFoundError('Beneficiarios no encontrados');
  }

  return beneficiaries;
};

const getBeneficiariesByUser = async (user_id) => {
  const result = await beneficiaryRepository.findByUserId(user_id);

  if (!result.length) {
    return [];
  }

  const beneficiariesData = await Promise.all(
    result.map(async (beneficiary) => {
      const location = await townshipRepository.findLocationByTownshipId(
        beneficiary.city_id
      );
      const image = await imageRepository.getImagesByBeneficiary(
        beneficiary.id
      );

      const healthData =
        (await beneficiaryRepository.getBeneficiaryHealthData(
          beneficiary.id
        )) || {};

      return formatDatesInData(
        {
          ...beneficiary,
          location,
          image,
          ...healthData,
        },
        [
          'birth_date',
          'created_at',
          'diagnosed_date',
          'history_date',
          'vaccination_date',
        ]
      );
    })
  );

  return beneficiariesData;
};

const createBeneficiary = async (beneficiaryData) => {

  const userPlan = await userService.getUserById(beneficiaryData.user_id);
  if (!userPlan.plan_id) {
    throw new ValidationError('El usuario no tiene un plan activo');
  }

  const plan = await planService.getPlanById(userPlan.plan_id);

  if (!plan) {
    throw new ValidationError('No se encontró el plan del usuario');
  }

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
  const existingBeneficiary = await beneficiaryRepository.findByIdentification(
    beneficiaryData.identification_number
  );
  if (existingBeneficiary) {
    throw new ValidationError(
      'Parece que tienes existe un beneficiario con el mismo documento'
    );
  }

  // Verificar el email antes de crear el beneficiario
  if (beneficiaryData.email) {
    // Verificar en tabla users
    const existingUser = await userRepository.findByEmail(beneficiaryData.email);
    if (existingUser) {
      throw new ValidationError('Este correo electrónico ya está en uso por un usuario');
    }
    
    // Verificar en tabla beneficiaries
    const existingBeneficiaryByEmail = await beneficiaryRepository.findByEmail(beneficiaryData.email);
    if (existingBeneficiaryByEmail) {
      throw new ValidationError('Este correo electrónico ya está en uso por otro beneficiario');
    }
  }

  beneficiaryData.removed = false;
  beneficiaryData.created_at = new Date();

  const newBeneficiary = await beneficiaryRepository.createBeneficiary(
    beneficiaryData
  );

  // Configurar la cuenta sin verificaciones redundantes
  if (beneficiaryData.email) {
    try {
      // Usar una versión simplificada que no verifica email
      await setupBeneficiaryAccount(newBeneficiary.id, beneficiaryData);
    } catch (error) {
      console.error('Error al configurar cuenta del beneficiario:', error);
      // Consideración: ¿deberíamos eliminar el beneficiario si falla la configuración?
    }
  }


  if (beneficiaryData.base_64) {
    await processImage(
      newBeneficiary.id,
      beneficiaryData.public_name,
      beneficiaryData.base_64
    );
  }

  const location = await townshipRepository.findLocationByTownshipId(
    newBeneficiary.city_id
  );
  const image = await imageRepository.getImagesByBeneficiary(newBeneficiary.id);

  return { ...newBeneficiary, location, image };
};

const updateBeneficiary = async (id, beneficiaryData) => {
  const beneficiary = await beneficiaryRepository.findById(id);
  if (!beneficiary) {
    throw new NotFoundError('Beneficiario no encontrado');
  }

  if (beneficiaryData.identification_number) {
    const existingBeneficiary =
      await beneficiaryRepository.findByIdentification(
        beneficiaryData.identification_number
      );

    if (existingBeneficiary && existingBeneficiary.id !== beneficiary.id) {
      throw new ValidationError(
        'Parece que ya existe un beneficiario con el mismo documento'
      );
    }
  }

  if (beneficiaryData.email && beneficiaryData.email !== beneficiary.email) {
    // Verificar en tabla users
    const existingUser = await userRepository.findByEmail(beneficiaryData.email);
    if (existingUser) {
      throw new ValidationError('Este correo electrónico ya está en uso por un usuario');
    }
    
    // Verificar en tabla beneficiaries (excluyendo este beneficiario)
    const existingBeneficiaryByEmail = await beneficiaryRepository.findByEmail(beneficiaryData.email);
    if (existingBeneficiaryByEmail && existingBeneficiaryByEmail.id !== beneficiary.id) {
      throw new ValidationError('Este correo electrónico ya está en uso por otro beneficiario');
    }
  }


  const updatedBeneficiary = await beneficiaryRepository.updateBeneficiary(
    id,
    beneficiaryData
  );

  if (beneficiaryData.email && beneficiaryData.email !== beneficiary.email) {
    try {
      await setupBeneficiaryAccount(id, {
        ...beneficiary,
        ...beneficiaryData
      });
    } catch (error) {
      console.error('Error al configurar cuenta del beneficiario:', error);
    }
  }

  if (beneficiaryData.base_64 && beneficiaryData.public_name) {
    await processImage(
      updatedBeneficiary.id,
      beneficiaryData.public_name,
      beneficiaryData.base_64
    );
  }

  const location = await townshipRepository.findLocationByTownshipId(
    updatedBeneficiary.city_id
  );
  const image = await imageRepository.getImagesByBeneficiary(
    updatedBeneficiary.id
  );
  const healthData =
    (await beneficiaryRepository.getBeneficiaryHealthData(
      updatedBeneficiary.id
    )) || {};

  return formatDatesInData(
    {
      ...updatedBeneficiary,
      location,
      image,
      ...healthData,
    },
    [
      'birth_date',
      'created_at',
      'diagnosed_date',
      'history_date',
      'vaccination_date',
    ]
  );
};

const removeBeneficiary = async (id) => {
  const beneficiary = await beneficiaryRepository.findById(id);
  if (!beneficiary) {
    throw new NotFoundError('Beneficiario no encontrado');
  }
  return await beneficiaryRepository.removeBeneficiary(id);
};

module.exports = {
  getBeneficiaryByIdentification,
  getBeneficiariesByUser,
  createBeneficiary,
  updateBeneficiary,
  removeBeneficiary,
  getBeneficiaryByUserId,
  countUserBeneficiaries,
  getBeneficiaryById,
};
