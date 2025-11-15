let express = require("express");
global.app = express();
app.use(express.json());

const dotenv = require("dotenv");
dotenv.config();
const PORT = process.env.PORT;

const { establishRedis } = require("./utility/redisConnect.js");
const { getRoutes } = require("./routes.js");

establishRedis();
getRoutes();

app.listen(PORT);
console.log("Listening on port 3000");
