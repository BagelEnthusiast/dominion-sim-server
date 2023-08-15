import express, { CookieOptions, response } from "express";
const app = express();
const port = 3000
import cors from 'cors';
import fs from 'fs';
import jwt, { SignOptions } from 'jsonwebtoken';
require('dotenv').config()
import axios from 'axios';
import qs from 'qs';
const crypto = require('crypto');

// referenced https://codevoweb.com/google-oauth-authentication-react-and-node/ source code for jwt functions

app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
  res.send('Hello World!');
})


//TODO: make this a seperate file

export const signJwt = (
  payload: Object,
  key: 'accessTokenPrivateKey' | 'refreshTokenPrivateKey',
  options: SignOptions = {}
) => {

  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  return jwt.sign(payload, privateKey, {
    ...(options && options),
    algorithm: 'RS256',
  });
};

// Sign Token
//TODO: specify user type
export const signToken = async (e: string) => {
  // Sign the access token
  console.log('user object: ', e)
  const access_token = signJwt({ email: e }, 'accessTokenPrivateKey', {
    expiresIn: `${process.env.accessTokenExpiresIn}m`,
  });

  // Sign the refresh token
  const refresh_token = signJwt({ email: e }, 'refreshTokenPrivateKey', {
    expiresIn: `${process.env.refreshTokenExpiresIn}m`,
  });

  // Create a Session  - TODO: store in redis??
  // redisClient.set(user._id, JSON.stringify(user), {
  //   EX: 60 * 60,
  // });

  // Return access token
  return { access_token, refresh_token };
};

// hard coding the time for now .. yikes
// Cookie options
const accessTokenCookieOptions: CookieOptions = {
  expires: new Date(
    Date.now() + 1 * 60 * 1000
  ),
  maxAge: 59 * 60 * 1000,
  httpOnly: false,
  sameSite: 'lax',
};

const refreshTokenCookieOptions: CookieOptions = {
  expires: new Date(
    Date.now() + 1 * 60 * 1000
  ),
  maxAge: 59 * 60 * 1000,
  httpOnly: false,
  sameSite: 'lax',
};



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

interface GoogleOauthToken {
  access_token: string;
  id_token: string;
  expires_in: number;
  refresh_token: string;
  token_type: string;
  scope: string;
}

export const getGoogleOauthToken = async ({
  code,
}: {
  code: string;
}): Promise<GoogleOauthToken> => {
  const rootURl = 'https://oauth2.googleapis.com/token';


  const options = {
    code,
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    redirect_uri: process.env.REDIRECT_URI,
    grant_type: 'authorization_code',
  };

  console.log('options: ', options)
  try {
    const { data } = await axios.post<GoogleOauthToken>(
      rootURl,
      qs.stringify(options),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return data;
  } catch (err: any) {
    console.log('Failed to fetch Google Oauth Tokens');
    throw new Error(err);
  }
};

interface GoogleUserResult {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

export async function getGoogleUser({
  id_token,
  access_token,
}: {
  id_token: string;
  access_token: string;
}): Promise<GoogleUserResult> {
  try {
    const { data } = await axios.get<GoogleUserResult>(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
      {
        headers: {
          Authorization: `Bearer ${id_token}`,
        },
      }
    );

    return data;
  } catch (err: any) {
    console.log(err);
    throw Error(err);
  }
}

app.get('/login', async (req, res, next) => {
    const code = req.query.code as string

    //const pathUrl = req.query.state as string
    //TODO: make pathURL dynamic
    //const pathUrl = (req.query.state as string) || '/';

    if (!code) {
      return next(new Error('Authorization code not provided!'));
    }

    const { id_token, access_token } = await getGoogleOauthToken({ code });
    
    const { name, verified_email, email, picture } = await getGoogleUser({
      id_token,
      access_token,
    });

    if (!verified_email) {
      return next(new Error('Google account not verified'));
    }

    //verify that user exists in database
    const buffer = fs.readFileSync("./database.json")
    const jsonStr = buffer.toString()
    const database = JSON.parse(jsonStr)
    console.log('database: ', database)

    if (!database.hasOwnProperty(email)) {
      //add a user to the database with email username
      
      database[email] = { "strategies": []}
      fs.writeFileSync('./database.json',JSON.stringify(database, null, 2))
    }
    console.log('name, email, picture: ', name, email, picture)

    // Create access and refresh token
    const { access_token: accessToken, refresh_token } = await signToken(email);

    // Send cookie
    res.cookie('refresh-token', refresh_token, refreshTokenCookieOptions);
    res.cookie('access-token', accessToken, accessTokenCookieOptions);
    res.cookie('user', email, { httpOnly: false });
    res.cookie('logged_in', true, {
      expires: new Date(
        //hard coding for now.. yikes
        Date.now() + 1 * 60 * 1000
      ),
    });
    res.redirect('http://localhost:5173');
    //TODO: redirect to pathUrl
    //res.redirect(pathUrl);

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
// const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
// const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// async function verifyGoogleToken(token: any) {
//   try {
//     const ticket = await client.verifyIdToken({
//       idToken: token,
//       audience: GOOGLE_CLIENT_ID,
//     });
//     return { payload: ticket.getPayload() };
//   } catch (error) {
//     return { error: "Invalid user detected. Please try again" };
//   }
// }

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