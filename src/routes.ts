import fs from "fs";
import {
  StrategyApiRequestBody,
  ApiData,
  CreateShoppingListItemBody,
  Strategy,
  DeleteStrategyBody,
} from "./interfaces";
import { getGoogleOauthToken, getGoogleUser } from "./oauthFunctions";
import { signToken } from "./jwtFunctions";
import { app, getDatabase, isDev } from "./server";

app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.get("/api", (req, res, next) => {
  res.send(getDatabase());
});
app.get("/api/user/:username", (req, res, next) => {
  const username = req.params.username;
  const database = getDatabase();
  const user = database[username];
  res.send(user);
});
app.post("/user/strategy/create", (req, res, next) => {
  const reqBody: StrategyApiRequestBody = req.body;
  const database: ApiData = getDatabase();
  database[reqBody.username].strategies.push(reqBody.strat);
  fs.writeFileSync("./database.json", JSON.stringify(database, null, 2));
  return res.json({ message: "Strategy Created" });
});
app.post(
  "/user/strategy/shoppingList/shoppingListItem/create",
  (req, res, next) => {
    const reqBody: CreateShoppingListItemBody = req.body;
    const database: ApiData = getDatabase();
    const strategy = database[reqBody.username].strategies.find(
      (strat: Strategy) => {
        return strat.id === reqBody.strategyId;
      }
    );
    if (strategy === undefined) {
      throw new Error("The strategy you are trying to update no longer exists");
    }
    strategy.shoppingList.push(reqBody.item);
    fs.writeFileSync("./database.json", JSON.stringify(database, null, 2));
    return res.json({ message: "Strategy Shopping List item created" });
  }
);
app.post("/user/strategy", (req, res, next) => {
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
app.delete("/user/strategy/delete", (req, res, next) => {
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
app.get("/login", async (req, res, next) => {
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
  const database = getDatabase();

  if (!database.hasOwnProperty(email)) {
    database[email] = { strategies: [] };
    fs.writeFileSync("./database.json", JSON.stringify(database, null, 2));
  }
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
