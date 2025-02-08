const imageRepository = require('./beneficiary.images.repository');
const { NotFoundError, ValidationError } = require('../../../core/errors');

const uploadImage = async (data) => {
  if (!image_path) {
    throw new ValidationError('La ruta de la imagen es obligatoria');
  }
  return await imageRepository.saveImage(data);
};

const getBeneficiaryImages = async (beneficiary_id) => {
  const images = await imageRepository.getImagesByBeneficiary(beneficiary_id);
  if (!images.length) {
    throw new NotFoundError('No se encontraron imágenes para este usuario');
  }
  return images;
};

const modifyImage = async (data) => {
  const existingImage = await imageRepository.updateImage(data);
  if (!existingImage) {
    throw new NotFoundError('Imagen no encontrada');
  }
  return existingImage;
};

const removeImage = async (id) => {
  const existingImage = await imageRepository.getImagesByUser(id);
  if (!existingImage) {
    throw new NotFoundError('Imagen no encontrada');
  }
  return await imageRepository.deleteImage(id);
};

module.exports = {
  uploadImage,
  getBeneficiaryImages,
  modifyImage,
  removeImage
};
