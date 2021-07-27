const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  capacity: {
    type: Number,
    required: true
  },
  info: {
    type: String,
    maxLength: 400
  }
});

module.exports = Room = mongoose.model("room", RoomSchema);