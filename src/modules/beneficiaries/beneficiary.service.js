const beneficiaryRepository = require('../beneficiaries/beneficiary.repository');
const { ValidationError, NotFoundError } = require('../../core/errors');
const { buildImage } = require('../../utils/image.utils');
const path = require('path');
const imageRepository = require('../images/beneficiary/beneficiary.images.repository');
const townshipRepository = require('../township/township.repository');
const PATHS = require('../../config/paths');
const { formatDatesInData } = require('../../utils/date.util');


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
  const result = await beneficiaryRepository.findByUserId(user_id);

  if (!result.length) {
    return [];
  }

  const beneficiariesData = await Promise.all(
    result.map(async (beneficiary) => {
      const location = await townshipRepository.findLocationByTownshipId(beneficiary.city_id);
      const image = await imageRepository.getImagesByBeneficiary(beneficiary.id);

      const healthData = await beneficiaryRepository.getBeneficiaryHealthData(beneficiary.id) || {};

      return formatDatesInData(
        { 
          ...beneficiary, 
          location, 
          image,
          ...healthData, 
        }, 
        ['birth_date', 'created_at', 'diagnosed_date', 'history_date', 'vaccination_date']
      );
    })
  );

  return beneficiariesData;
};



const createBeneficiary = async (beneficiaryData) => {
  // Contar beneficiarios del usuario
  const beneficiaryCount = await beneficiaryRepository.countByUserId(beneficiaryData.user_id);

  if (beneficiaryCount >= 5) {
    throw new ValidationError('No puedes agregar más de 5 beneficiarios.');
  }

  const existingBeneficiary = await beneficiaryRepository.findByIdentification(
    beneficiaryData.identification_number
  );
  if (existingBeneficiary) {
    throw new ValidationError(
      'Parece que tienes un beneficiario con el mismo documento'
    );
  }

  beneficiaryData.removed = false;
  beneficiaryData.created_at = new Date();

  const newBeneficiary = await beneficiaryRepository.createBeneficiary(beneficiaryData);

  if (beneficiaryData.base_64) {
    await processImage(newBeneficiary.id, beneficiaryData.public_name, beneficiaryData.base_64);
  }

  const location = await townshipRepository.findLocationByTownshipId(newBeneficiary.city_id);
  const image = await imageRepository.getImagesByBeneficiary(newBeneficiary.id);

  return { ...newBeneficiary, location, image };
};


const updateBeneficiary = async (id, beneficiaryData) => {
  const beneficiary = await beneficiaryRepository.findById(id);
  if (!beneficiary) {
    throw new NotFoundError('Beneficiario no encontrado');
  }

  if (beneficiaryData.identification_number) {
    const existingBeneficiary = await beneficiaryRepository.findByIdentification(beneficiaryData.identification_number);
  
    if (existingBeneficiary && existingBeneficiary.id !== beneficiary.id) {
      throw new ValidationError(
        'Parece que ya existe un beneficiario con el mismo documento'
      );
    }
  }
  

  const updatedBeneficiary = await beneficiaryRepository.updateBeneficiary(id, beneficiaryData);

  if (beneficiaryData.base_64 && beneficiaryData.public_name) {
    await processImage(updatedBeneficiary.id, beneficiaryData.public_name, beneficiaryData.base_64);
  }

  const location = await townshipRepository.findLocationByTownshipId(updatedBeneficiary.city_id);
  const image = await imageRepository.getImagesByBeneficiary(updatedBeneficiary.id);
  const healthData = await beneficiaryRepository.getBeneficiaryHealthData(updatedBeneficiary.id) || {};

  return formatDatesInData(
    { 
      ...updatedBeneficiary, 
      location, 
      image,
      ...healthData, 
    }, 
    ['birth_date', 'created_at', 'diagnosed_date', 'history_date', 'vaccination_date']
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
};
