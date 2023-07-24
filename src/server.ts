import express from "express";
const app = express();
const port = 3000
import cors from 'cors';
import fs from 'fs';

// todopaul

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
