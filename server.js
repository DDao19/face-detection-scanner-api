import express from 'express';
import cors from 'cors';
import bcrypt from "bcrypt";
import knex from 'knex';
import dotenv from 'dotenv'


dotenv.config()

// connect to our database using knex
const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})


const app = express()

// Parse JSON bodies (application/json)
app.use(express.json())
// Simple Usage: Enable All CORS Requests
app.use(cors())

app.get("/", async (req, res) => {
  res.send('Success')
})

app.post('/signin', async (req, res) => {
  try {
    const {email, password} = req.body
    const user = await db.from('users').innerJoin('login', 'users.email', 'login.email').where('login.email', email)
    
    if (user[0].email === email && bcrypt.compareSync(password, user[0].hash)) {
      res.json(user)
    } else {
      res.status(404).json("email or password is incorrect")
    }
    
  } catch (error) {
    res.status(404).json("email or password is incorrect")
  }
})

app.post('/register', async (req, res) => {
 
  try {
    const {firstName, lastName, email, password} = req.body
    const saltRounds = 10;
    const hashpw = bcrypt.hashSync(password, saltRounds)

    await db.transaction(async (trx) => {
      
      const saveLoginInfo = await trx('login').insert({
        email: email,
        hash: hashpw
      }).returning('*')

      const user = await trx('users').insert({
        firstname: firstName,
        lastname: lastName,
        email: email,
        joined: new Date()
      }).returning('*')

      const profile = await trx('users').select('*').where('email', email)

      res.json(profile)
    })
    
  } catch (error) {
    res.status(400).json('Error: unable to register')
  }

})

app.get('/profile/:id', async (req, res) => {
  const {id} = req.params

  try {
    const userProfile = await db('users').where({id: id})

    if (userProfile.length) {
      res.json(userProfile)
    } else {
      res.status(404).json("User not found")
    }
  } catch (error) {
    res.status(404).json("No user found")
  }
  
})

app.put('/image', async (req, res) => {
  try {
    const {email} = req.body
    const updateEntries = await db('users').where('email', '=', email).increment('entries', 1).returning('*')
   
    res.json(updateEntries)
  } catch (error) {
    res.status(400).json("unable to get entries")
  }
})



app.listen(process.env.PORT || 3000, () => {
  console.log("App is running on port 3000...")
})
