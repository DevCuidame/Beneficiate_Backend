const townshipRepository = require('./township.repository');
const { ValidationError } = require('../../core/errors');

// Obtener municipio por ID
const getTownshipById = async (township_id) => {
  if (!township_id) {
    throw new ValidationError('El ID del municipio es obligatorio');
  }

  const township = await townshipRepository.findLocationByTownshipId(township_id);
  if (!township) {
    throw new ValidationError('No se encontró el municipio');
  }

  return township;
};

// Obtener todas las ciudades por departamento
const getTownshipsByDepartment = async (department_id) => {
  if (!department_id) {
    throw new ValidationError('El ID del departamento es obligatorio');
  }

  const townships = await townshipRepository.findTownshipsByDepartmentId(department_id);
  if (!townships.length) {
    throw new ValidationError('No se encontraron municipios para este departamento');
  }

  return townships;
};

// Obtener todos los departamentos
const getAllDepartments = async () => {
  const departments = await townshipRepository.findAllDepartments();
  if (!departments.length) {
    throw new ValidationError('No se encontraron departamentos');
  }

  return departments;
};

module.exports = { getTownshipById, getTownshipsByDepartment, getAllDepartments };
