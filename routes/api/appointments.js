const express = require("express")
const { check, validationResult } = require("express-validator");
const router = express.Router()

const auth = require("../../middleware/auth");

const Appointment = require("../../models/Appointment")

//get all appointments
router.get("/", async (req, res) => {
  
  try{
    const data = await Appointment.find()

    res.status(200).json(data)
  } catch (error) {
    console.error(error.message)
    res.status(404).json({message: error.message})
  }
})

//get all of today's appointments

router.get("/today", auth, async(req, res)=>{

//get todays date then slice off the time component, setting the time to 00:00 by creating a new date with just the date

const date = new Date().toISOString().slice(0,10)

console.log(date)

//get a start time for the search by creating a date object from the date, which will start at 00:00 on that date
const startOfDate = new Date(date)
console.log(startOfDate)

//create an end time for the search by concantating  23:59:59 to the date and then creating a new date object
const endOfDate = new Date(date + "T23:59:59.999")
console.log(endOfDate)

//now a query to the db to get all of the appointments for that particular room on that particular day

try {

const todaysAppointments = await Appointment.find({startTime: {$gte: startOfDate, $lte: endOfDate}})

console.log(todaysAppointments)

res.status(200).send("success so far")
} catch(error) {
console.error(error.message)
res.status(404).json({message: error.message})
  }
})

//make an appointment
router.post("/", auth, async(req, res)=> {
let { room, startTime, endTime, notes } = req.body;

const user = req.user.id

//start and end times to dates for comparision and validation purposes
startTime = new Date(startTime)
endTime = new Date(endTime)

//first, a bit of validation of the submitted data
//set up error object
const errors = []

//check dates are not in the past
if (startTime < Date.now()) {
  errors.push("Start time cannot be in the past")
}

if (endTime < Date.now()) {
   errors.push("End time cannot be in the past")
}

//check end time is after start time

if (endTime <= startTime) {errors.push("End time must be after start time")}

if(errors.length > 0) {
  return res.status(500).json({errors})
}

//get the date from the start time by slicing that bit off. 

const date = startTime.toISOString().slice(0,10)
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
res.status(500).json({ msg: "Server Error" });
}
})


module.exports = router