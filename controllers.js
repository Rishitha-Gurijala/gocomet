const { mongoConnect } = require("./utility/mongoConnect.js");
const { establishRedis } = require("./utility/redisConnect.js");
let amqp = require("amqplib");
const dotenv = require("dotenv");
dotenv.config();
const RABBITMQ_URL = process.env.RABBITMQ_URL;
const queue = process.env.queue;

async function getPlayerInfo(req, res) {
  let db = await mongoConnect();
  let id = req?.params?.id;
  if (!id) {
    return res.status(500).json({
      message: "Please enter valid Parameters!!",
    });
  }
  if (!client) {
    establishRedis();
  }
  let doc = await client.get(id);
  if (!doc) {
    doc = await db.collection("players").findOne({ playerId: id });
    doc = JSON.stringify(doc);
    if (!client) {
      establishRedis();
    }
    await client.set(id, doc, { EX: 60 });
  }
  doc = JSON.parse(doc);
  if (!doc) {
    doc = {
      message: "Player not found!!",
    };
  }
  return res.status(200).json(doc);
}

async function createRide(req, res) {
  let body = req.body;
  if (body && body.userId) {
    await publishMessage(body);

    return res.status(200).json({ status: "queued" });
  } else {
    return res.status(500).json({
      message: "Please enter valid Inputs!!",
    });
  }
}

module.exports = {
  createRide,
  getPlayerInfo,
};

async function publishMessage(message) {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
      persistent: true,
    });
    console.log("Message sent:", message.userId);
    setTimeout(() => {
      connection.close();
    }, 500);
  } catch (error) {
    console.error("Error publishing message:", error);
  }
}
