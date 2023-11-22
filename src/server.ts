import express from "express";
export const app = express();
const port = 3000;
import cors from "cors";
import { createApiRouter } from "./router";
require("dotenv").config();

app.use(cors());
app.use(createApiRouter());
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
