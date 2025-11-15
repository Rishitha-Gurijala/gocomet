const {
  createRide,
  validateUser,
  createUser,
} = require("./controllers.js");

function getRoutes() {
  app.get("/v1/validateUser/:id/:password", validateUser);
  app.post("/v1/createUser", createUser);
  app.post("/v1/rides", createRide);
}

module.exports = {
  getRoutes,
};
