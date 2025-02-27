const professionalImagesRepository = require('./medical_professionals_image.repository');
const { ValidationError, NotFoundError } = require('../../core/errors');

const getProfessionalImageById = async (id) => {
  const image = await professionalImagesRepository.findProfessionalImageById(id);
  if (!image) {
    throw new NotFoundError('Imagen del profesional no encontrada');
  }
  return image;
};

const getAllProfessionalImages = async () => {
  const images = await professionalImagesRepository.getAllProfessionalImages();
  if (!images || !images.length) {
    return [];
  }
  return images;
};

const createProfessionalImage = async (imageData) => {
  if (!imageData.professional_id) {
    throw new ValidationError('El ID del profesional es requerido.');
  }
  // Asigna la fecha actual si no se envía uploaded_at
  imageData.uploaded_at = imageData.uploaded_at || new Date();

  const newImage = await professionalImagesRepository.createProfessionalImage(imageData);
  return { ...newImage };
};

const updateProfessionalImage = async (id, imageData) => {
  const existingImage = await professionalImagesRepository.findProfessionalImageById(id);
  if (!existingImage) {
    throw new NotFoundError('Imagen del profesional no encontrada');
  }
  const updatedImage = await professionalImagesRepository.updateProfessionalImage(id, imageData);
  return { ...updatedImage };
};

const deleteProfessionalImage = async (id) => {
  const existingImage = await professionalImagesRepository.findProfessionalImageById(id);
  if (!existingImage) {
    throw new NotFoundError('Imagen del profesional no encontrada');
  }
  await professionalImagesRepository.deleteProfessionalImage(id);
  return { message: 'Imagen del profesional eliminada correctamente' };
};

module.exports = {
  getProfessionalImageById,
  getAllProfessionalImages,
  createProfessionalImage,
  updateProfessionalImage,
  deleteProfessionalImage,
};
