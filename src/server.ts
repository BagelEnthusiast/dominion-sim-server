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
import { GoogleOauthToken, GoogleUserResult } from './interfaces'

// referenced https://codevoweb.com/google-oauth-authentication-react-and-node/ source code for jwt functions

const isDev = process.env.DEV_MODE

app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
  res.send('Hello World!');
})

const getDatabase = () => {
  const buffer = fs.readFileSync("./database.json")
  const jsonStr = buffer.toString()
  return JSON.parse(jsonStr)
}

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
  sameSite: 'none',
  domain: 'https://dominion-sim-client.vercel.app/',
  
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
  res.send(getDatabase())
})

app.get('/api/user/:username', (req, res, next) => {
  const username = req.params.username
  const database = getDatabase()
  const user = database[username]
  res.send(user)
})

export interface UserData {
  strategies: Strategy[]
}

export interface ApiData {
  [user: string]: UserData
}

export interface ShoppingListItem {
  card: string,
  quantity: number
}

export interface Strategy {
  label: string
  shoppingList: ShoppingListItem[]
}

export interface StrategyApiRequestBody {
  strat: Strategy,
  username: string
}

app.post('/user/strategy', (req, res, next) => {
  const reqBody: StrategyApiRequestBody = req.body;
  const database: ApiData = getDatabase()
  const strategyIndex = database[reqBody.username].strategies.findIndex((strat) => {
    return strat.label === reqBody.strat.label
  })
  database[reqBody.username].strategies.splice(strategyIndex, 1, reqBody.strat)
  fs.writeFileSync('./database.json',JSON.stringify(database, null, 2))
  return res.json({ message: 'Strategy Updated' });
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})


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
    redirect_uri: isDev === "true" ? process.env.REDIRECT_URI : process.env.REDIRECT_URI_PROD,
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
// app.get('/login,')
// app.get('/login', (req, res) => {
//   res.send('Hello World!');
// })

app.get('/login', async (req, res, next) => {
    console.log('req.query: ', req.query)
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

    isDev === 'true' ? res.redirect('http://localhost:5173') : res.redirect('https://dominion-sim-client.vercel.app/')

    //TODO: redirect to pathUrl
    //res.redirect(pathUrl);

})

