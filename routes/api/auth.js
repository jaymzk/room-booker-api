const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('config')
const {check, validationResult } = require("express-validator")

const User = require('../../models/User')

router.get('/', auth, async (req, res)=> {
  try {
    const user = await User.findById(req.user.id).select("-password")
    res.json(user)
  } catch(error){
    res.status(500).send("Server Error")
  }
  
})

module.exports = router