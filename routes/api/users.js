const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
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
        config.get("jwtSecret"),
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

module.exports = router;