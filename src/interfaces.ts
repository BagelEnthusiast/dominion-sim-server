
export interface UserData {
  strategies: Strategy[];
}

export interface ApiData {
  [user: string]: UserData;
}

export interface ShoppingListItem {
  id: string;
  card: string;
  quantity: number;
}

export interface Strategy {
  id: string;
  label: string;
  shoppingList: ShoppingListItem[];
}

export interface StrategyApiRequestBody {
  strat: Strategy;
  username: string;
}
export interface ShoppingListItemDTO {
  strategyId: string;
  username: string;
  item: ShoppingListItem;
}
export interface DeleteStrategyBody {
  id: string;
  username: string;
}

export interface GoogleOauthToken {
  access_token: string;
  id_token: string;
  expires_in: number;
  refresh_token: string;
  token_type: string;
  scope: string;
}

export interface GoogleUserResult {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}
