const express = require("express");
const multer = require("multer")
const sharp = require("sharp")
const auth = require("../../middleware/auth");
const admin = require("../../middleware/admin")

const router = express.Router();

const { check, validationResult } = require("express-validator");

const Room = require("../../models/Room");

//get all rooms
router.get('/', auth, async(req, res)=> {
  try {
    const rooms = await Room.find()

    res.status(200).json(rooms)

    } catch(error) {

      res.status(404).json({msg: error.message})

    }
})

//create room, admin
router.post(
  "/",
  [
    check("name", "Name is required").not().isEmpty(),
    check("capacity", "Room Capacity is required").not().isEmpty(),
    check("info", "Info must be 400 characters or less").isLength({max: 400})
    
  ], admin,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, capacity, info, image} = req.body;

    try {
      //check if room exists already
      let room = await Room.findOne({ name });

      if (room) {
        return res.status(400).json([{ msg: "Room already exists" }]);
      }

      room = new Room({
        name,
        capacity,
        info, 
        image
      });

      await room.save();

      return res.status(200).json({"msg": "Room successfully created."})

    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server error");
    }
  }
);

//edit room, info etc. admin
router.put("/:id", admin, async (req, res) => {
  const {
    name, 
    capacity,
    info,
  } = req.body;


  //build a user object based on the fields submitted
  const updateFields = {};
  if (name) updateFields.name = name;
  if (capacity) updateFields.capacity = email;
  if (info) updateFields.info = info;
  

  try {
    
    let room = await Room.findById(req.params.id);
    if (!Room) return res.status(404).json({ msg: "Room not found" });


    room = await Room.findByIdAndUpdate(req.params.id,
      { $set: updateFields },
      { $new: true }
    );

    res.status(200).json(room);

  } catch (error) {
    console.error(error.message);
  }
});

router.delete("/:id", admin, async (req, res) => {
 
  try {

    let room = await Room.findById(req.params.id);

    if (!room) return res.status(404).json({ msg: "Room not found" });

    room = await Room.findByIdAndDelete(req.params.id)

    res.status(200).json({msg: "Room Deleted"});
    
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({error: error.message})
  }
});

//upload an image 
const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter (req, file, cb){
    if(!file.originalname.match(/\.(jpg|jpeg|png|svg)$/)) {
      return cb(new Error("Please upload an image"))
    }    
    cb(undefined, true)
  } 
})

router.post("/image/:id", admin, upload.single("image"), async (req, res) => {

let room = await Room.findById(req.params.id);

  if (!Room) return res.status(404).json({ msg: "Room not found" });

const buffer = await sharp(req.file.buffer).resize({width:600, height: 600}).png().toBuffer()

  room.image = buffer

  await room.save()

  res.status(200).json({msg: 'Image uploaded sucessfully'})
}, (error, req, res, next) => {
  res.status(400).json({msg: error.message})
})

//delete an image
router.delete("/image/:id", admin, async (req, res) => {
  try {
    let room = await Room.findById(req.params.id);

    if (!room) return res.status(404).json({ msg: "Room not found" });

    if (!room.image) return res.status(404).json({ msg: "Image not found" });

    room = await Room.findByIdAndUpdate(req.params.id, {$unset: {image: 1 }})

    res.status(200).json({msg: "Image deleted"});
    
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({error: error.message})
  }
})

//route to get pics for img tags
router.get("/image/:id", async (req, res) => {
  try{
    const room = await Room.findById(req.params.id)
    console.log(room)

    if(!room) {res.status(404).json({msg: "Room not found"})} 

     if(!room.image) {res.status(404).json({msg: "Image not found"})} 

    res.set("Content-Type", "image/png")
    res.send(room.image)

  } catch(error) {
    res.status(404).json({msg: "Image not found"})
  }

})

module.exports = router;