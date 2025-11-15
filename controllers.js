const { mongoConnect } = require("./utility/mongoConnect.js");
const { establishRedis } = require("./utility/redisConnect.js");
let amqp = require("amqplib");
const dotenv = require("dotenv");
const db = require("./mysqldb");
dotenv.config();
const RABBITMQ_URL = process.env.RABBITMQ_URL;
const queue = process.env.queue;

function generateFourDigitRandom() {
  return Math.floor(1000 + Math.random() * 9000);
}

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
    console.log("dshbj");
    await publishMessage(body);

    return res.status(200).json({ status: "queued" });
  } else {
    return res.status(500).json({
      message: "Please enter valid Inputs!!",
    });
  }
}

async function validateUser(req, res) {
  let id = req.params.id;
  id = parseInt(id);
  let password = req.params.password;
  let [users] = await db
    .promise()
    .query("SELECT userId,password  FROM users where userId = ?", [id]);
  let user = users[0];
  if (user.userId == id && user.password !== password) {
    return res.status(200).json({ message: "incorrect" });
  }
  if (user.userId == id && user.password == password) {
    return res.status(200).json({ message: "valid" });
  }
  return res.status(500).json({
    message: "invalid",
  });
}

async function validateDriver(req, res) {
  let id = req.params.id;
  id = parseInt(id);
  let password = req.params.password;
  let [users] = await db
    .promise()
    .query("SELECT * FROM drivers where id = ?", [id]);
  let user = users[0];
  if (user && user.id == id && user.password !== password) {
    return res.status(200).json({ message: "incorrect" });
  }
  if (user && user.id == id && user.password == password) {
    return res.status(200).json({ message: "valid" });
  }
  return res.status(200).json({
    message: "invalid",
  });
}

async function createUser(req, res) {
  try {
    let { userId, password, name } = req.body;
    if (!userId) {
      userId = generateFourDigitRandom();
    }
    const parsedUserId = parseInt(userId);

    const [existingUsers] = await db
      .promise()
      .query("SELECT * FROM users WHERE userId = ?", [parsedUserId]);

    if (existingUsers.length > 0) {
      return res.status(201).json({
        success: true,
        message: "User with this ID already exists",
      });
    }

    const [result] = await db
      .promise()
      .query(
        "INSERT INTO users (userId, userName, password) VALUES (?, ?, ?)",
        [parsedUserId, name, password],
      );

    if (result.affectedRows === 1) {
      return res.status(201).json({
        success: true,
        message: "User created successfully",
      });
    } else {
      throw new Error("Failed to create user");
    }
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating user",
      error: error.message,
    });
  }
}

async function createDriver(req, res) {
  try {
    let { driverId, password, name } = req.body;
    if (!driverId) {
      driverId = generateFourDigitRandom();
    }
    const parsedDriverId = parseInt(driverId);

    const [existingUsers] = await db
      .promise()
      .query("SELECT * FROM drivers WHERE id = ?", [parsedDriverId]);

    if (existingUsers.length > 0) {
      return res.status(201).json({
        success: true,
        message: "User with this ID already exists",
      });
    }

    const [result] = await db
      .promise()
      .query("INSERT INTO drivers (id, name, password) VALUES (?, ?, ?)", [
        parsedDriverId,
        name,
        password,
      ]);

    if (result.affectedRows === 1) {
      return res.status(201).json({
        success: true,
        message: "User created successfully",
      });
    } else {
      throw new Error("Failed to create user");
    }
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating user",
      error: error.message,
    });
  }
}

async function listUsers(req, res) {
  try {
    let users = await db.promise().query("SELECT * FROM users");
    users = users[0];
    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching users from database",
      error: error.message,
    });
  }
}

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

module.exports = {
  createRide,
  getPlayerInfo,
  validateUser,
  validateDriver,
  listUsers,
  createUser,
  createDriver,
};
