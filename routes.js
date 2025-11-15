const { play, getPlayerInfo } = require("./controllers.js");

function getRoutes() {
  app.post("/play", play);
  app.get("/player/:id", getPlayerInfo);
}

module.exports = {
  getRoutes,
};
