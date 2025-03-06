const userRepository = require('../users/user.repository');
const planService = require('../plans/plan.service');
const imageService = require('../images/user/user.images.service');
const beneficiaryImageService = require('../images/beneficiary/beneficiary.images.service');
const townshipService = require('../township/township.service');
const { NotFoundError } = require('../../core/errors');
const beneficiaryRepository = require('../beneficiaries/beneficiary.repository');
const findByEmail = async (email) => {
  const user = await userRepository.findByEmail(email);

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  const plan = await planService.getPlanById(user.plan_id);
  const images = await imageService.getUserImages(user.id);
  const image = images.length > 0 ? images[0] : null;
  const location = await townshipService.getTownshipById(user.city_id);

  return { ...user, plan, image, location };
};

const getUserById = async (id) => {
  const user = await userRepository.getUserById(id);

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  return user;
};

const findByIdentification = async (
  identification_type,
  identification_number
) => {
  const user = await userRepository.findByTypeIdentification(
    identification_type,
    identification_number
  );
  console.log(user);
  const beneficiary = await beneficiaryRepository.findByTypeIdentification(
    identification_type,
    identification_number
  );
  console.log(beneficiary);

  if (!user && !beneficiary) {
    throw new NotFoundError(
      'Beneficiario no encontrado con ese número y tipo de identificación.'
    );
  }

  if (user) {
    const plan = await planService.getPlanById(user.plan_id);
    const images = await imageService.getUserImages(user.id);
    const image = images.length > 0 ? images[0] : null;
    const location = await townshipService.getTownshipById(user.city_id);

    return { ...user, plan, image, location };
  } else if (beneficiary) {
    const images = await beneficiaryImageService.getBeneficiaryImages(beneficiary.id);
    const image = images.length > 0 ? images[0] : null;
    const location = await townshipService.getTownshipById(beneficiary.city_id);

    return { ...beneficiary, image, location };
  }
};

module.exports = { findByEmail, getUserById, findByIdentification };
