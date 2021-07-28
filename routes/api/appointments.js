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

//get the date from the start time by slicing that bit off. 

const date = startTime.slice(0,10)
console.log(date)

//get a start time for the search by creating a date object from the date, which will start at 00:00 on that date
const startOfDate = new Date(date)
console.log(startOfDate)

//create an end time for the search by concantating  23:59:59 to the date and then creating a new date object
const endOfDate = new Date(date + "T23:59:59.999")
console.log(endOfDate)

//now a query to the db to get all of the appointments for that particular room on that particular day

const todaysAppointments = await Appointment.find({room, startTime: {$gte: startOfDate, $lte: endOfDate}})

console.log(todaysAppointments)

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