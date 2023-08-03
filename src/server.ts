import express, { response } from "express";
const app = express();
const port = 3000
import cors from 'cors';
import fs from 'fs';
import { OAuth2Client } from "google-auth-library";
const jwt = require("jsonwebtoken");
require('dotenv').config()

const session = require('express-session')
const request = require('request-promise')
const http = require('http');
const https = require('https');
const url = require('url');
import { google } from 'googleapis';

// todopaul
app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
  res.send('Hello World!');
})

// app.use(session({
//   secret: 'your_secret_here',
//   resave: false,
//   saveUninitialized: true
// }))

app.get('/api', (req, res, next) => {
  const buffer = fs.readFileSync("./database.json")
  const jsonStr = buffer.toString()
  const database = JSON.parse(jsonStr)
  res.send(database)
})

app.get('/api/user/:username', (req, res, next) => {
  const username = req.params.username
  const buffer = fs.readFileSync("./database.json")
  const jsonStr = buffer.toString()
  const database = JSON.parse(jsonStr)
  const user = database[username]
  res.send(user)
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

app.post('/api/login', (req, res, next) => {
  console.log('request body', req.body)
  const { username, password } = req.body;
  console.log('username, password: ', username, password)
  return res.json({ message: 'Login Successful', user: username });
})

// const oauth2Client = new google.auth.OAuth2(
//   process.env.YOUR_CLIENT_ID,
//   process.env.YOUR_CLIENT_SECRET,
//   process.env.YOUR_REDIRECT_URL
// );

// const redirectUrl = oauth2Client.generateAuthUrl({
//   access_type: 'offline',
//   prompt: 'consent',
//   scope: ['email', 'profile']
// })

/**
 *  This function is used verify a google account
 */
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

async function verifyGoogleToken(token: any) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    return { payload: ticket.getPayload() };
  } catch (error) {
    return { error: "Invalid user detected. Please try again" };
  }
}

// TODO: add a signup route

// app.post("/signup", async (req, res) => {
//   try {
//      console.log({ verified: verifyGoogleToken(req.body.credential) });
//     if (req.body.credential) {
//       const verificationResponse = await verifyGoogleToken(req.body.credential);

//       if (verificationResponse.error) {
//         return res.status(400).json({
//           message: verificationResponse.error,
//         });
//       }

//       const profile = verificationResponse?.payload;

//       // TODO: push profile to database here
//       // DB.push(profile);

//       res.status(201).json({
//         message: "Signup was successful",
//         user: {
//           firstName: profile?.given_name,
//           lastName: profile?.family_name,
//           picture: profile?.picture,
//           email: profile?.email,
//           token: jwt.sign({ email: profile?.email }, "myScret", {
//             expiresIn: "1d",
//           }),
//         },
//       });
//     }
//   } catch (error) {
//     res.status(500).json({
//       message: "An error occurred. Registration failed.",
//     });
//   }
// });

// app.get("/login", async (req, res) => {
//   try {
//     console.log('req.body: ', req.body)
//     if (req.body.credential) {
//       const verificationResponse = await verifyGoogleToken(req.body.credential);
//       if (verificationResponse.error) {
//         return res.status(400).json({
//           message: verificationResponse.error,
//         });
//       }

//       const profile = verificationResponse?.payload;
//       console.log('profile: ', profile)
//       // TODO: do this but for json file
//       // const existsInDB = DB.find((person) => person?.email === profile?.email);

//       const buffer = fs.readFileSync("./database.json")
//       const jsonStr = buffer.toString()
//       const database = JSON.parse(jsonStr)

//       if (profile?.email) {
        
//         if (!database[profile?.email]) {
//           return res.status(400).json({
//             message: "You are not registered. Please sign up",
//           });
//         }
//       }

//       res.status(201).json({
//         message: "Login was successful",
//         user: {
//           firstName: profile?.given_name,
//           lastName: profile?.family_name,
//           picture: profile?.picture,
//           email: profile?.email,
//           token: jwt.sign({ email: profile?.email }, process.env.JWT_SECRET, {
//             expiresIn: "1d",
//           }),
//         },
//       });
//     }
//   } catch (error) {
//     res.status(500).json({
//       message: error,
//     });
//   }
// });

//todo: authorization for login function