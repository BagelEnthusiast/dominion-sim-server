const express = require("express");
const app = express();
const port = 3000

const database =  require("./database.json")

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/api', (req, res, next) => {
  res.send(database);
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
