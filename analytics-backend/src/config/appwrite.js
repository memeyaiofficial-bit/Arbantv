import dotenv from "dotenv";
dotenv.config(); // Force load env here

import { Client, Databases } from "appwrite";

if (!process.env.APPWRITE_ENDPOINT) {
  throw new Error("APPWRITE_ENDPOINT is not defined in .env");
}

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

export const databases = new Databases(client);