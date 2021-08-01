const mongoose = require("mongoose");

const AppointmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "rooms",
    required: true
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
    maxLength: 400
  },
  dateStamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = Appointment = mongoose.model("appointment", AppointmentSchema);