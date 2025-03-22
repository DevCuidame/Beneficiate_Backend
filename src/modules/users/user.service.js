const userRepository = require('../users/user.repository');
const planService = require('../plans/plan.service');
const imageService = require('../images/user/user.images.service');
const beneficiaryImageService = require('../images/beneficiary/beneficiary.images.service');
const townshipService = require('../township/township.service');
const { NotFoundError } = require('../../core/errors');
const beneficiaryRepository = require('../beneficiaries/beneficiary.repository');
const userHealthData = require('../users/health/user.health.service');

const findByEmail = async (email) => {
  const user = await userRepository.findByEmail(email);

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  const plan = await planService.getPlanById(user.plan_id);
  const images = await imageService.getUserImages(user.id);
  const image = images.length > 0 ? images[0] : null;
  const location = await townshipService.getTownshipById(user.city_id);
  const healthData = await userHealthData.getUserHealthData(user.id);

  return { ...user, plan, image, location, healthData };
};

const getUserById = async (id) => {
  const user = await userRepository.getUserById(id);

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  const plan = await planService.getPlanById(user.plan_id);
  const images = await imageService.getUserImages(user.id);
  const image = images.length > 0 ? images[0] : null;
  const location = await townshipService.getTownshipById(user.city_id);
  const healthData = await userHealthData.getUserHealthData(user.id);

  return { ...user, plan, image, location, healthData };
};

const findByIdentification = async (
  identification_type,
  identification_number
) => {
  const user = await userRepository.findByTypeIdentification(
    identification_type,
    identification_number
  );
  const beneficiary = await beneficiaryRepository.findByTypeIdentification(
    identification_type,
    identification_number
  );

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

    return { ...user, plan, image, location, is_user: true };
  } else if (beneficiary) {
    console.log(beneficiary);
    const images = await beneficiaryImageService.getBeneficiaryImages(beneficiary.id);
    const image = images.length > 0 ? images[0] : null;
    const location = await townshipService.getTownshipById(beneficiary.city_id);

    return { ...beneficiary, image, location, is_user: false };
  }
};

module.exports = { findByEmail, getUserById, findByIdentification };
