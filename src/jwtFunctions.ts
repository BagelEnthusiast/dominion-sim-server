import jwt, { SignOptions } from "jsonwebtoken";
const crypto = require("crypto");

export const signJwt = (
  payload: Object,
  key: "accessTokenPrivateKey" | "refreshTokenPrivateKey",
  options: SignOptions = {}
) => {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

  return jwt.sign(payload, privateKey, {
    ...(options && options),
    algorithm: "RS256",
  });
};

export const signToken = async (e: string) => {
  const access_token = signJwt({ email: e }, "accessTokenPrivateKey", {
    expiresIn: `${process.env.accessTokenExpiresIn}m`,
  });

  // Sign the refresh token
  const refresh_token = signJwt({ email: e }, "refreshTokenPrivateKey", {
    expiresIn: `${process.env.refreshTokenExpiresIn}m`,
  });
  return { access_token, refresh_token };
};
