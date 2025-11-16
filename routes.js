const {
  createRide,
  validateUser,
  createUser,
  validateDriver,
  createDriver,
  updateDriverLocation,
  getUserRide,
  getAllRides,
  updateRideInfo,
  endTrip,
} = require("./controllers.js");

function getRoutes() {
  // user
  app.get("/v1/validateUser/:id/:password", validateUser);
  app.post("/v1/createUser", createUser);
  app.post("/v1/rides", createRide);
  app.get("/v1/viewRide/:userId", getUserRide);

  //driver
  app.get("/v1/validateDriver/:id/:password", validateDriver);
  app.post("/v1/createDriver", createDriver);
  app.post("/v1/updateDriverLocation", updateDriverLocation);
  app.get("/v1/viewAllRides/:driverId", getAllRides);
  app.post("/v1/acceptRide", updateRideInfo);
  app.post("/v1/trips/end", endTrip);
}

module.exports = {
  getRoutes,
};
