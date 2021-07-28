const express = require("express")
const router = express.Router()

const auth = require("../../middleware/auth");

const Appointment = require("../../models/Appointment")

//basic test route
router.get("/", async (req, res) => {
  res.send("Hello from the appointments route")
})

//make an appointment
router.post("/", auth, async(req, res)=> {
const { room, startTime, endTime, notes } = req.body;

const user = req.user.id

//get the date from the start time.

const date = startTime.slice(9)
console.log(date)

try {
  const appointment = new Appointment({
  user,
  room, 
  startTime,
  endTime,
  notes
}) 

await appointment.save()
return res.status(200).send("Appointment created")

}

catch(error) {
console.error(error.message)
res.status(500).json([{ msg: "Server Error" }]);
}
})


module.exports = router