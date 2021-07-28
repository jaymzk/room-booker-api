const express = require("express");
const auth = require("../../middleware/auth");
const router = express.Router();

const { check, validationResult } = require("express-validator");

const Room = require("../../models/Room");

//basic get route for testing
router.get('/', async(req, res)=> {
  res.send('A OK from the rooms route')
})

//create room, public
router.post(
  "/",
  [
    check("name", "Name is required").not().isEmpty(),
    check("capacity", "Room Capacity is required").not().isEmpty(),
    check("info", "Info must be 400 characters or less").isLength({max: 400})
    
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, capacity, info} = req.body;

    try {
      //check if room exists already
      let room = await Room.findOne({ name });

      if (room) {
        return res.status(400).json([{ msg: "Room already exists" }]);
      }

      room = new Room({
        name,
        capacity,
        info
      });

      await room.save();

      return res.status(500).json({"msg": "Room successfully created."})

    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server error");
    }
  }
);

//edit room, info etc
router.put("/", auth, async (req, res) => {
  const {
    name, 
    capacity,
    info
  } = req.body;

  //build a user object based on the fields submitted
  const updateFields = {};
  if (name) updateFields.name = name;
  if (capacity) updateFields.capacity = email;
  if (info) updateFields.info = info 

  try {
    
    let room = await Room.findOne({ name });

    if (!Room) return res.status(404).json({ msg: "Room not found" });


    room = await Room.findOneAndUpdate({name},
      { $set: updateFields },
      { $new: true }
    );

    res.status(500).json({msg: "Room updated"});

  } catch (error) {
    console.error(error.message);
  }
});

router.delete("/", auth, async (req, res) => {
  const {name} = req.body
  try {

    let room = await Room.findOne({ name });

    if (!room) return res.status(404).json({ msg: "Room not found" });

    room = await Room.findOneAndDelete({name})

    res.status(500).json({msg: "Room Deleted"});
    
  } catch (error) {
    console.error(error.message);
  }
});

module.exports = router;