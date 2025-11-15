const {
  createRide,
  validateUser,
  createUser,
  validateDriver,
  createDriver,
} = require("./controllers.js");

function getRoutes() {
  app.get("/v1/validateUser/:id/:password", validateUser);
  app.post("/v1/createUser", createUser);
  app.get("/v1/validateDriver/:id/:password", validateDriver);
  app.post("/v1/createDriver", createDriver);
  app.post("/v1/rides", createRide);
}

module.exports = {
  getRoutes,
};
