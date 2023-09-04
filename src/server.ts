import express, { CookieOptions, response } from "express";
export const app = express();
const port = 3000;
import cors from "cors";
import fs from "fs";
require("dotenv").config();

// referenced https://codevoweb.com/google-oauth-authentication-react-and-node/ source code for jwt functions

export const isDev = process.env.DEV_MODE;

app.use(express.json());
app.use(cors());

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

export const getDatabase = () => {
  const buffer = fs.readFileSync("./database.json");
  const jsonStr = buffer.toString();
  return JSON.parse(jsonStr);
};


