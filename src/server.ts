import express, { response } from "express";
const app = express();
const port = 3000
import cors from 'cors';
import fs from 'fs';

// todopaul
app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
  res.send('Hello World!');
})

app.get('/api', (req, res, next) => {
  const buffer = fs.readFileSync("./database.json")
  const jsonStr = buffer.toString()
  const database = JSON.parse(jsonStr)
  res.send(database)
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
