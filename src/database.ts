import fs from "fs";
import {
  ApiData,
  ShoppingListItemDTO,
  Strategy,
  UserData
} from "./interfaces";


export const getDatabase = (): ApiData => {
  if (!fs.existsSync('./database.json')) {
    fs.writeFileSync('./database.json', '{}', 'utf8');
  }
  const buffer = fs.readFileSync("./database.json");
  const jsonStr = buffer.toString();
  return JSON.parse(jsonStr);
};

const updateDatabase = async (database: ApiData) => {
  await fs.promises.writeFile("./database.json", JSON.stringify(database, null, 2));
}

const updateUser = async (username: string, data: UserData) => {
  const database = getDatabase();
  database[username] = data;
  await updateDatabase(database);
}

export const getStrategy = (requestBody: ShoppingListItemDTO, database: ApiData) => {
  const strategy = database[requestBody.username].strategies.find(
    (strat: Strategy) => {
      return strat.id === requestBody.strategyId;
    }
  );
  if (strategy === undefined) {
    throw new Error("The strategy you are trying to update no longer exists");
  }
  return strategy;
};

export const getUser = async (username: string): Promise<UserData> => {
  const database = getDatabase();
  const user = database[username];
  return user;
}

export const createUser = async (email: string): Promise<void> => {
  const user = getUser(email);
  if (!user) {
    await updateUser(email, { strategies: [] });
  }
}

export const createStrategy = async (username: string, strat: Strategy): Promise<void> => {
  const user = await getUser(username);
  user.strategies.push(strat);
  await updateUser(username, user);
}
