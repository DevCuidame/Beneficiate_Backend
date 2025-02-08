const imageService = require('../user/user.images.service');
const { successResponse, errorResponse } = require('../../../core/responses');

const uploadImage = async (req, res) => {
  try {
    const { user_id, public_name, private_name, image_path } = req.body;
    const image = await imageService.uploadImage(user_id, public_name, private_name, image_path);
    successResponse(res, image, 'Imagen subida exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

const getUserImages = async (req, res) => {
  try {
    const { user_id } = req.params;
    const images = await imageService.getUserImages(user_id);
    successResponse(res, images, 'Imágenes recuperadas exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

const modifyImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { public_name, private_name, image_path } = req.body;
    const updatedImage = await imageService.modifyImage(id, public_name, private_name, image_path);
    successResponse(res, updatedImage, 'Imagen actualizada exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

const removeImage = async (req, res) => {
  try {
    const { id } = req.params;
    await imageService.removeImage(id);
    successResponse(res, null, 'Imagen eliminada exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

module.exports = {
  uploadImage,
  getUserImages,
  modifyImage,
  removeImage
};
