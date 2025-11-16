var express = require("express");
var Razorpay = require("razorpay");
var cors = require("cors");
var crypto = require("crypto");
var dist = require("geo-distance-js");

const { prices } = require("./priceChart.js");

let amqp = require("amqplib");
const dotenv = require("dotenv");
const db = require("./mysqldb");
dotenv.config();
const RABBITMQ_URL = process.env.RABBITMQ_URL;
const queue = process.env.queue;

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

function generateFourDigitRandom() {
  return Math.floor(1000 + Math.random() * 9000);
}

async function getUserRide(req, res) {
  let userId = req.params.userId;
  let [users] = await db
    .promise()
    .query("SELECT *  FROM rides where userId = ?", [userId]);
  return res.status(200).json({
    data: users,
  });
}

async function getAllRides(req, res) {
  let driverId = req.params.driverId;
  let [users] = await db
    .promise()
    .query("SELECT *  FROM drivers where id = ?", [driverId]);
  let userIds = [];
  if (users && users.length) {
    userIds = users[0].users;
  }
  let [rides] = await db
    .promise()
    .query("SELECT *  FROM rides where userId in (?)", [userIds]);
  return res.status(200).json({
    data: rides,
  });
}

async function createRide(req, res) {
  let body = req.body;
  let statuses = ["WAITING", "IN_PROGRESS"];
  if (body && body.userId) {
    let [users] = await db
      .promise()
      .query("SELECT userId  FROM rides where userId = ? and status in (?)", [
        body.userId,
        statuses,
      ]);

    if (!users.length) {
      await publishMessage(body);
      return res.status(200).json({ status: "queued" });
    } else {
      return res.status(200).json({ status: "cannot book another ride" });
    }
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
  if (user && user.userId == id && user.password !== password) {
    return res.status(200).json({ message: "incorrect" });
  }
  if (user && user.userId == id && user.password == password) {
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
    return res.status(200).json({ message: "valid", name: user.name });
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

    const [update] = await db
      .promise()
      .query(`UPDATE drivers SET users = "[]" WHERE id = ${parsedDriverId}`);

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

async function updateDriverLocation(req, res) {
  try {
    let { latitude, longitude, driverId } = req.body;
    const [update] = await db
      .promise()
      .query(
        `UPDATE drivers SET latitude = ${latitude}, longitude = ${longitude}, is_available = "true"  WHERE id = ${driverId}`,
      );
    if (update?.affectedRows > 0) {
      return res.status(200).json({
        message: "Driver location updated!!",
        success: true,
      });
    } else {
      return res.status(200).json({
        message: "No affected rows",
        success: true,
      });
    }
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching users from database",
      error: error.message,
    });
  }
}

async function updateRideInfo(req, res) {
  try {
    let { rideId, driverId } = req.body;
    const [update] = await db
      .promise()
      .query(
        `UPDATE drivers SET is_available = "false"  WHERE id = ${driverId}`,
      );
    const [rideUpdate] = await db
      .promise()
      .query(
        `UPDATE rides SET status = "IN_PROGRESS", driverId = ${driverId}  WHERE id = ${rideId}`,
      );
    if (rideUpdate?.affectedRows > 0) {
      return res.status(200).json({
        message: "Ride Info Updated Successfully",
        success: true,
      });
    } else {
      return res.status(200).json({
        message: "No affected rows",
        success: true,
      });
    }
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching users from database",
      error: error.message,
    });
  }
}

async function endTrip(req, res) {
  try {
    let { rideId, driverId } = req.body;
    const [update] = await db
      .promise()
      .query(
        `UPDATE drivers SET is_available = "true"  WHERE id = ${driverId}`,
      );
    let [rides] = await db
      .promise()
      .query("SELECT *  FROM rides where id = ?", [rideId]);

    let ride = rides[0];

    let distance = dist.getDistance(
      ride.pickup_lat,
      ride.pickup_long,
      ride.dropoff_lat,
      ride.dropoff_long,
    );
    distance = Math.round(distance / 1000);
    let fare = 0;

    for (let obj of prices) {
      if (distance > obj.start && distance < obj.end) {
        fare = obj.price;
        break;
      }
    }
    fare = !fare ? 750 : fare;

    const [rideUpdate] = await db
      .promise()
      .query(
        `UPDATE rides SET status = "FINISHED", fare=${fare}  WHERE id = ${rideId}`,
      );

    if (rideUpdate?.affectedRows > 0) {
      return res.status(200).json({
        message: "Ride finished Successfully",
        success: true,
        fare: fare,
      });
    } else {
      return res.status(200).json({
        message: "No affected rows",
        success: true,
      });
    }
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
  validateUser,
  validateDriver,
  listUsers,
  createUser,
  createDriver,
  updateDriverLocation,
  updateRideInfo,
  endTrip,
  getUserRide,
  getAllRides,
};
