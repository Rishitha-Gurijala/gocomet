const {
  createRide,
  validateUser,
  createUser,
  validateDriver,
  createDriver,
  updateDriverLocation,
} = require("./controllers.js");

function getRoutes() {
  app.get("/v1/validateUser/:id/:password", validateUser);
  app.post("/v1/createUser", createUser);
  app.post("/v1/rides", createRide);
  app.get("/v1/viewRide/:userId", validateDriver);

  app.get("/v1/validateDriver/:id/:password", validateDriver);
  app.post("/v1/createDriver", createDriver);
  app.post("/v1/updateDriverLocation", updateDriverLocation);
  app.get("/v1/viewAllRides/:driverId", validateDriver);
}

module.exports = {
  getRoutes,
};
