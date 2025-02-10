const userRepository = require('../users/user.repository');
const planService = require('../plans/plan.service');
const imageService = require('../images/user/user.images.service');
const townshipService = require('../township/township.service');
const { NotFoundError } = require('../../core/errors');

const findByEmail = async (email) => {
  const user = await userRepository.findByEmail(email);
  console.log("🚀 ~ findByEmail ~ user:", user.plan_id);

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  const plan = await planService.getPlanById(user.plan_id);
  const images = await imageService.getUserImages(user.id);
  const image = images.length > 0 ? images[0] : null; 
  const location = await townshipService.getTownshipById(user.city_id);

  return { ...user, plan, image, location };
};


module.exports = { findByEmail };
