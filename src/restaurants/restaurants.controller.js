const restaurantsService = require("./restaurants.service.js");
const asyncErrorBoundary = require("../errors/asyncErrorBoundary");
const hasProperties = require("../errors/hasProperties");
// import from errors folder
const hasRequiredProperties = hasProperties("restaurant_name", "cuisine", "address");

// middlware to validate properties of restaurant 
const VALID_PROPERTIES = [
    "restaurant_name",
    "cuisine",
    "address",
];

// middleware to check if request body contains specified set of allowed fields 
function hasOnlyValidProperties(req, res, next) {
  const { data = {} } = req.body;

  const invalidFields = Object.keys(data).filter(
    (field) => !VALID_PROPERTIES.includes(field)
  );

  if (invalidFields.length) {
    return next({
      status: 400,
      message: `Invalid field(s): ${invalidFields.join(", ")}`,
    });
  }
  next();
}

// middlware to check if restaurant exists
async function restaurantExists(req, res, next) {
  const { restaurantId } = req.params;

  const restaurant = await restaurantsService.read(restaurantId);

  if (restaurant) {
    res.locals.restaurant = restaurant;
    return next();
  }
  next({ status: 404, message: `Restaurant cannot be found.` });
}

// list func 
async function list(req, res, next) {
  const data = await restaurantsService.list();
  res.json({ data });
}

// create func
function create(req, res, next) {
  restaurantsService
    .create(req.body.data)
    .then((data) => res.status(201).json({ data }))
    .catch(next);
}

// update func 
function update(req, res, next) {
  const updatedRestaurant = {
    ...req.body.data,
    restaurant_id: res.locals.restaurant.restaurant_id,
  };
restaurantsService
  .update(updatedRestaurant)
  .then((data) => res.json({ data }))
  .catch(next);
}

// delete/destroy func 
function destroy(req, res, next) {
  restaurantsService
  .delete(res.locals.restaurant.restaurant_id)
  .then(() => res.sendStatus(204))
  .catch(next);
}


// export middlware and funcs 
module.exports = {
  list: asyncErrorBoundary(list),
  create: [hasOnlyValidProperties, hasRequiredProperties, asyncErrorBoundary(create)], 
  update: [asyncErrorBoundary(restaurantExists), asyncErrorBoundary(update)],
  delete: [asyncErrorBoundary(restaurantExists), asyncErrorBoundary(destroy)],
};
