const townshipService = require('./township.service');
const { successResponse, errorResponse } = require('../../core/responses');

const getTownshipById = async (req, res) => {
  try {
    const { townshipId } = req.params;
    const township = await townshipService.getTownshipById(townshipId);

    successResponse(res, township, 'Municipio obtenido exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

const getTownshipsByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const townships = await townshipService.getTownshipsByDepartment(departmentId);

    successResponse(res, townships, 'Municipios obtenidos exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

const getAllDepartments = async (req, res) => {
  try {
    const departments = await townshipService.getAllDepartments();

    successResponse(res, departments, 'Departamentos obtenidos exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

module.exports = { getTownshipById, getTownshipsByDepartment, getAllDepartments };
