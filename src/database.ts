import fs from "fs";
import {
  ApiData,
  ShoppingListItemDTO,
  Strategy
} from "./interfaces";


export const getDatabase = () => {
  if (!fs.existsSync('./database.json')) {
    fs.writeFileSync('./database.json', '{}', 'utf8');
  }
  const buffer = fs.readFileSync("./database.json");
  const jsonStr = buffer.toString();
  return JSON.parse(jsonStr);
};

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
