const beneficiaryRepository = require('../beneficiaries/beneficiary.repository');
const { ValidationError, NotFoundError } = require('../../core/errors');
const { buildImage } = require('../../utils/image.utils');
const path = require('path');
const imageRepository = require('../images/beneficiary/beneficiary.images.repository');
const PATHS = require('../../config/paths');

const processImage = async (beneficiaryId, publicName, base64) => {
  if (!base64 || !publicName) return null;

  const extension = publicName.substring(publicName.lastIndexOf('.'));
  const privateName = `USER_${nanoid(20)}${extension}`;
  const imagePath = path.join(PATHS.PROFILE_IMAGES, privateName);

  try {
    await buildImage(privateName, 'profile', base64);
    const imageData = {
      beneficiary_id: beneficiaryId,
      public_name: publicName,
      private_name: privateName,
      image_path: imagePath
    };
    return await imageRepository.saveImage(imageData);
  } catch (error) {
    throw new ValidationError('Error al guardar la imagen: ' + error.message);
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

const getBeneficiariesByUser = async (user_id) => {
  const beneficiaries = await beneficiaryRepository.findByUserId(user_id);
  if (!beneficiaries.length) {
    return [];
  }
  return beneficiaries;
};


const createBeneficiary = async (beneficiaryData) => {
  const { nanoid } = await import('nanoid');
  const existingBeneficiary = await beneficiaryRepository.findByIdentification(
    beneficiaryData.identification_number
  );
  if (existingBeneficiary) {
    throw new ValidationError(
      'Parece que tienes un beneficiario con el mismo documento'
    );
  }

  beneficiaryData.removed = false; // Removed by default
  beneficiaryData.created_at = new Date(); // Set creation date

  // Crear beneficiario primero
  const newBeneficiary = await beneficiaryRepository.createBeneficiary(
    beneficiaryData
  );

  // Procesar imagen si viene en base64
  if (beneficiaryData.base_64) {
    await processImage(newBeneficiary.id, beneficiaryData.public_name, beneficiaryData.base_64);
  }

  return newBeneficiary;
};

const updateBeneficiary = async (id, beneficiaryData) => {
  const beneficiary = await beneficiaryRepository.findByIdentification(
    beneficiaryData.identification_number
  );
  if (!beneficiary) {
    throw new NotFoundError('Beneficiario no encontrado');
  }

  const existingBeneficiary = await beneficiaryRepository.findByIdentification(
    beneficiaryData.identification_number
  );
  if (existingBeneficiary) {
    throw new ValidationError(
      'Parece que ya existe un beneficiario con el mismo documento'
    );
  }

  return await beneficiaryRepository.updateBeneficiary(id, beneficiaryData);
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
};
