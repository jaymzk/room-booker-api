const express = require("express");
const auth = require("../../middleware/auth");
const router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { check, validationResult } = require("express-validator");

const User = require("../../models/User");

//basic get route for testing
router.get('/', async(req, res)=> {
  res.send('A OK from the users route')
})

//create user, public
router.post(
  "/",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check(
      "password",
      "Please include a password of 6 or more characters"
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, privilegeLevel } = req.body;

    try {
      //check user exists
      let user = await User.findOne({ email });

      if (user) {
        return res.status(400).json([{ msg: "User already exists" }]);
      }

      user = new User({
        name,
        privilegeLevel,
        email,
        password,
      });

      //encrypt the password
      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);

      await user.save();

      //return json webtoken

      const payload = {
        user: {
          id: user.id,
          privilegeLevel: user.privilegeLevel,
        },
      };

      jwt.sign(
        payload,
        process.env.jwtSecret,
        { expiresIn: 360000 },
        (error, token) => {
          if (error) throw error;
          res.json({ token });
        }
      );
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server error");
    }
  }
);

//edit user, change username, email password etc
router.put("/:id", auth, async (req, res) => {
  const {
    name, 
    email, 
    password
  } = req.body;

  //build a user object based on the fields submitted
  const updateFields = {};
  if (name) updateFields.name = name;
  if (email) updateFields.email = email;
  if (password) {
    const salt = await bcrypt.genSalt(10);

    updateFields.password = await bcrypt.hash(password, salt);
  }

  try {
    
    const userToUpdate = await User.findById(req.params.id);

    if (!userToUpdate) return res.status(404).json({ msg: "User not found" });

    if (userToUpdate.id.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { $new: true }
    );

    res.json(updatedUser);

  } catch (error) {
    console.error(error.message);
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    
    const userToDelete = await User.findById(req.params.id);

    if (!userToDelete) return res.status(404).json({ msg: "User not found" });

    if (userToDelete.id.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }
    userToDelete = await User.findByIdAndDelete(req.params.id);
    res.json(userToDelete);
    //
  } catch (error) {
    console.error(error.message);
  }
});

module.exports = router;