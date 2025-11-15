const { createRide } = require("./controllers.js");

function getRoutes() {
  app.post("/v1/rides", createRide);
}

module.exports = {
  getRoutes,
};
