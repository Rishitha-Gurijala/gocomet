
const dotenv = require("dotenv");
dotenv.config();

async function createRide(req, res) {
  let body = req.body;
  if (body && body.userId) {
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

  return res.status(200).json({ message: "valid" });
  
}

async function createUser(req, res) {
  try {
    let { userId, password, name } = req.body;
    return res.status(201).json({
      success: true,
      message: "User created successfully",
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating user",
      error: error.message,
    });
  }
}

module.exports = {
  createRide,
  validateUser,
  createUser,
};
