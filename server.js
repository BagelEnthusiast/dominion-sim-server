const express = require("express");
const app = express();
const port = 3000
const cors = require('cors')
const fs = require('fs')

// todopaul

app.use(cors())

app.get('/', (req, res) => {
  res.send('Hello World!')
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
