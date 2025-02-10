const townshipRepository = require('./township.repository');
const { ValidationError } = require('../../core/errors');

const getTownshipById = async (township_id) => {
  if (!township_id) {
    throw new ValidationError('El ID del municipio es obligatorio');
  }

  const township = await townshipRepository.findLocationByTownshipId(
    township_id
  );
  if (!township) {
    throw new ValidationError('No se encontró el municipio');
  }

  return township;
};

// const getTownshipsByDepartment = async (department_id) => {
//   if (!department_id) {
//     throw new ValidationError('El ID del departamento es obligatorio');
//   }

//   return await townshipRepository.findTownshipsByDepartment(department_id);
// };

module.exports = { getTownshipById };
