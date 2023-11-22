import express from "express";
import fs from "fs";
require("dotenv").config();
import {
  StrategyApiRequestBody,
  ApiData,
  ShoppingListItemDTO,
  Strategy,
  DeleteStrategyBody,
} from "./interfaces";
import { getGoogleOauthToken, getGoogleUser } from "./oauthFunctions";
import { signToken } from "./jwtFunctions";
import { createUser, getDatabase, createStrategy, getStrategy, getUser } from "./database";

export const isDev = process.env.DEV_MODE;

export const createApiRouter = () => {
  const router = express.Router();
  router.use(express.json());

  router.get("/", (req, res) => {
    res.send("Hello World!");
  });
  router.get("/api", (req, res, next) => {
    res.send(getDatabase());
  });
  router.get("/api/user/:username", async (req, res, next) => {
    const username = req.params.username;
    const user = await getUser(username);
    res.send(user);
  });
  router.get("/login", async (req, res, next) => {
    const code = req.query.code as string;
  
    if (!code) {
      return next(new Error("Authorization code not provided!"));
    }
    const { id_token, access_token } = await getGoogleOauthToken({ code });
    const { name, verified_email, email, picture } = await getGoogleUser({
      id_token,
      access_token,
    });
  
    if (!verified_email) {
      return next(new Error("Google account not verified"));
    }

    await createUser(email);
    console.log("name, email, picture: ", name, email, picture);
  
    // Create access and refresh token
    const { access_token: accessToken, refresh_token } = await signToken(email);
  
    const baseUrl =
      isDev === "true"
        ? "http://localhost:5173"
        : "https://dominion-sim-client.vercel.app";
    const formattedUrl = `${baseUrl}/oauth/?t=${accessToken}`;
    res.redirect(formattedUrl);
  });
  router.post("/user/strategy/create", async (req, res, next) => {
    const reqBody: StrategyApiRequestBody = req.body;
    await createStrategy(reqBody.username, reqBody.strat)
    return res.json({ message: "Strategy Created" });
  });
  router.post(
    "/user/strategy/shoppingList/shoppingListItem/create",
    (req, res, next) => {
      const reqBody: ShoppingListItemDTO = req.body
      const database: ApiData = getDatabase();
      const strategy = getStrategy(reqBody, database)
      strategy.shoppingList.push(reqBody.item);
      fs.writeFileSync("./database.json", JSON.stringify(database, null, 2));
      return res.json({ message: "Strategy Shopping List item created" });
    }
  );
  router.post("/user/strategy", (req, res, next) => {
    const reqBody: StrategyApiRequestBody = req.body;
    const database: ApiData = getDatabase();
    const strategyIndex = database[reqBody.username].strategies.findIndex(
      (strat) => {
        return strat.id === reqBody.strat.id;
      }
    );
    database[reqBody.username].strategies.splice(strategyIndex, 1, reqBody.strat);
    fs.writeFileSync("./database.json", JSON.stringify(database, null, 2));
    return res.json({ message: "Strategy Updated" });
  });
  
  router.delete("/user/strategy/delete", (req, res, next) => {
    const reqBody: DeleteStrategyBody = req.body;
    const database: ApiData = getDatabase();
    const strategyIndex = database[reqBody.username].strategies.findIndex(
      (strat) => {
        return strat.id === reqBody.id;
      }
    );
    const deletedStrategy = database[reqBody.username].strategies.splice(
      strategyIndex,
      1
    );
    fs.writeFileSync("./database.json", JSON.stringify(database, null, 2));
    return res.json({ message: `${deletedStrategy} deleted` });
  });
  router.delete("/user/strategy/shoppingList/shoppingListItem/delete", (req, res, next) => {
    const reqBody: ShoppingListItemDTO = req.body
    const database: ApiData = getDatabase();
    const strategy: Strategy = getStrategy(reqBody, database)
    const itemIndex = strategy.shoppingList.findIndex(item => {
      return item.id === reqBody.item.id
    })
    const deletedItem = strategy.shoppingList.splice(itemIndex, 1)
    fs.writeFileSync("./database.json", JSON.stringify(database, null, 2));
    return res.json({ message: `${deletedItem} deleted` });
  })
  return router
}