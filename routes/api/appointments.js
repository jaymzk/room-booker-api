const express = require("express")
const { check, validationResult } = require("express-validator");
const router = express.Router()

const auth = require("../../middleware/auth");

const Appointment = require("../../models/Appointment")

//get all appointments. Test route
router.get("/", async (req, res) => {
  
  try{
    const data = await Appointment.find()

    res.status(200).json(data)
  } catch (error) {
    console.error(error.message)
    res.status(404).json({message: error.message})
  }
})


//get all appointments on a certain date

router.get("/date/:date", auth, async(req, res)=>{

//get date then slice off the time component, setting the time to 00:00 by creating a new date with just the date

let date = new Date(req.params.date).toISOString().slice(0,10)

//get a start time for the search by creating a date object from the date, which will start at 00:00 on that date
const startOfDate = new Date(date)

//create an end time for the search by concantating  23:59:59 to the date and then creating a new date object
const endOfDate = new Date(date + "T23:59:59.999")

//now a query to the db to get all of the appointments for that particular day

try {

const appointments = await Appointment.find({startTime: {$gte: startOfDate, $lte: endOfDate}}).populate("user", ["name", "email"]).populate("room", "name").sort({startTime: 1, room: 1})

res.status(200).json({data:appointments})
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


//get a start time for the search by creating a date object from the date, which will start at 00:00 on that date
const startOfDate = new Date(date)


//create an end time for the search by concantating  23:59:59 to the date and then creating a new date object
const endOfDate = new Date(date + "T23:59:59.999")

//now a query to the db to get all of the appointments for that particular room on that particular day

const todaysAppointments = await Appointment.find({room, startTime: {$gte: startOfDate, $lte: endOfDate}}).populate("user", ["name", "email"]).populate("room", "name").sort({startTime: 1, room: 1})

//check for clashes

const clashes = todaysAppointments.filter(appointment => {
  return (
  appointment.startTime >= startTime && appointment.startTime <= endTime) ||
  (appointment.endTime >= startTime && appointment.endTime <= endTime) ||
  (appointment.startTime <= startTime && appointment.endTime >= endTime)
  })

if(clashes.length > 0) return res.status(500).json({clashes})

//knock 1ms off the end time so it doesn't clash with the start of the next appointment

endTime = endTime.getTime()-1

//finally, create the appointment!!
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

//edit an appointment 
router.put("/:id", auth, async(req, res)=>{
    let {
      room, 
      startTime, 
      endTime, 
      notes
    } = req.body
    const user = req.user.id
    const appointment_id = req.params.id

    startTime = new Date(startTime)
    endTime = new Date(endTime)

    const errors = []

    //same sort of validation as making an appointment but checking for a few extra fields

if (startTime < Date.now()) {
  errors.push("Start time cannot be in the past")
}

if (endTime < Date.now()) {
   errors.push("End time cannot be in the past")
}

if(room && !startTime) {
  errors.push("Please supply a start time")
}
if(room && !endTime) {
  errors.push("Please supply a duration")
}
if(endTime && !startTime) {
  errors.push("Please supply a start time")
}
if(startTime && !endTime) {
  errors.push("Please supply a duration")
}

//check end time is after start time

if (endTime <= startTime) {errors.push("End time must be after start time")}

  if(errors.length > 0) {
    return res.status(500).json({errors})
    }

  

//now check for clashes. Same as before. No need to do this if only the notes are being changed

if (room || startTime || endTime) {
 
const date = startTime.toISOString().slice(0,10)

const startOfDate = new Date(date)

const endOfDate = new Date(date + "T23:59:59.999")

//now a query to the db to get all of the appointments for that particular room on that particular day

const todaysAppointments = await Appointment.find({room, startTime: {$gte: startOfDate, $lte: endOfDate}}).populate("user", ["name", "email"]).populate("room", "name").sort({startTime: 1, room: 1})

//check for clashes

//to do: appointments that start / finish at exactly the same time

//also to do: remove the current appointment from clashes we don't want it clashing with itself

let clashes = todaysAppointments.filter(appointment => {
  return (
  appointment.startTime >= startTime && appointment.startTime <= endTime) ||
  (appointment.endTime >= startTime && appointment.endTime <= endTime) ||
  (appointment.startTime <= startTime && appointment.endTime >= endTime)
  })

clashes = clashes.filter(clash => clash._id.toString()!== appointment_id)

if(clashes.length > 0) return res.status(500).json({clashes})

}

 const updateFields = {};
  if (startTime) updateFields.startTime = startTime;
  if (endTime) updateFields.endTime = endTime;
  if (room) updateFields.room = room;
  if (notes) updateFields.notes = notes
  
try {
  let appointment = await Appointment.findById(appointment_id);
    if (!Appointment) return res.status(404).json({ msg: "Appointment not found" });

    appointment = await Appointment.findByIdAndUpdate(appointment_id,
      { $set: updateFields },
      { $new: true }
    );

    res.status(200).json(msg: "Appointment amended successfully");

} catch(error) {
    console.error(error.message);
    return res.status(500).json({error: error.message})

}
})


//delete appointment
//Either auth and it's your appointment, or admin.

router.delete("/:id", auth, async(req, res)=>{
  
  try {
    const appointment = await Appointment.findById(req.params.id)
  
    if(!appointment) {
      return res.status(404).json({msg: "Appointment not found"})
    }

  //check user is allowed to delete appointment. It must be either their appointment or they must be an admin
  if((appointment.user.toString() !== req.user.id) && req.user.status !==1){
    return res.status(401).json({msg: "User not authorized"})
  }
  await appointment.remove()

  res.status(200).json({msg: "Appointment deleted"})

  } catch(error) {
    console.error(error.message)
    res.status(500).send("Server Error")
  }
})


module.exports = router