const mongoose = require("mongoose");

const AppointmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  },
  date: {
    type: Date,
    required: true,
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "rooms"
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  notes: {
    type: String,
  },
  dateStamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = Appointment = mongoose.model("appointment", AppointmentSchema);