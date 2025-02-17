const serviceRepository = require('./services.repository');
const { NotFoundError, ValidationError } = require('../../core/errors');

const getAllServices = async () => {
    return await serviceRepository.getAllServices();
};

const getServiceById = async (id) => {
    const service = await serviceRepository.getServiceById(id);
    if (!service) {
        throw new NotFoundError('Servicio no encontrado');
    }
    return service;
};

const createService = async (serviceData) => {
    if (!serviceData.name || !serviceData.image_path || !serviceData.whatsapp_link) {
        throw new ValidationError('Todos los campos son obligatorios: nombre, imagen y enlace de WhatsApp.');
    }
    return await serviceRepository.createService(serviceData);
};

const updateService = async (id, serviceData) => {
    const existingService = await serviceRepository.getServiceById(id);
    if (!existingService) {
        throw new NotFoundError('Servicio no encontrado');
    }
    return await serviceRepository.updateService(id, serviceData);
};

const deleteService = async (id) => {
    const existingService = await serviceRepository.getServiceById(id);
    if (!existingService) {
        throw new NotFoundError('Servicio no encontrado');
    }
    return await serviceRepository.deleteService(id);
};

module.exports = {
    getAllServices,
    getServiceById,
    createService,
    updateService,
    deleteService
};
