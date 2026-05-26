const express = require('express')
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')
const connectToDatabase = require('../models/db')
const router = express.Router()
const dotenv = require('dotenv')
const pino = require('pino')
const { validationResult } = require('express-validator')
dotenv.config()

const logger = pino()
const JWT_SECRET = process.env.JWT_SECRET

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const db = await connectToDatabase()
    const collection = db.collection('users')
    const existingEmail = await collection.findOne({ email: req.body.email })

    if (existingEmail) {
      logger.error('Email id already exists')
      return res.status(400).json({ error: 'Email id already exists' })
    }

    const salt = await bcryptjs.genSalt(10)
    const hash = await bcryptjs.hash(req.body.password, salt)
    const email = req.body.email
    const newUser = await collection.insertOne({
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      password: hash,
      createdAt: new Date()
    })

    const payload = {
      user: {
        id: newUser.insertedId
      }
    }

    const authtoken = jwt.sign(payload, JWT_SECRET)
    logger.info('User registered successfully')
    res.json({ authtoken, email })
  } catch (e) {
    logger.error(e)
    return res.status(500).send('Internal server error')
  }
})

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const db = await connectToDatabase()
    const collection = db.collection('users')
    const theUser = await collection.findOne({ email: req.body.email })

    if (theUser) {
      const result = await bcryptjs.compare(req.body.password, theUser.password)
      if (!result) {
        logger.error('Passwords do not match')
        return res.status(404).json({ error: 'Wrong password' })
      }

      const userName = theUser.firstName
      const userEmail = theUser.email

      const payload = {
        user: {
          id: theUser._id.toString()
        }
      }
      const authtoken = jwt.sign(payload, JWT_SECRET)
      res.json({ authtoken, userName, userEmail })
    } else {
      logger.error('User not found')
      return res.status(404).json({ error: 'User not found' })
    }
  } catch (e) {
    return res.status(500).send('Internal server error')
  }
})

// Update endpoint
router.put('/update', async (req, res) => {
  // Task 2: Validate input
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    logger.error('Validation errors in update request', errors.array())
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    // Task 3: Check if email is in headers
    const email = req.headers.email
    if (!email) {
      logger.error('Email not found in the request headers')
      return res.status(400).json({ error: 'Email not found in the request headers' })
    }

    // Task 4: Connect to MongoDB
    const db = await connectToDatabase()
    const collection = db.collection('users')

    // Task 5: Find the user
    const existingUser = await collection.findOne({ email })
    if (!existingUser) {
      logger.error('User not found')
      return res.status(404).json({ error: 'User not found' })
    }

    existingUser.updatedAt = new Date()
    existingUser.firstName = req.body.firstName || existingUser.firstName
    existingUser.lastName = req.body.lastName || existingUser.lastName

    // Task 6: Update user in database
    const updatedUser = await collection.findOneAndUpdate(
      { email },
      { $set: existingUser },
      { returnDocument: 'after' }
    )

    // Task 7: Create JWT token
    const payload = {
      user: {
        id: updatedUser._id.toString()
      }
    }
    const authtoken = jwt.sign(payload, JWT_SECRET)

    res.json({ authtoken })
  } catch (e) {
    return res.status(500).send('Internal server error')
  }
})

module.exports = router
