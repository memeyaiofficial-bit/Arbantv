require('dotenv').config();
const { Client, Storage, Databases, Query, InputFile } = require('node-appwrite');

// Environment variable validation
const requiredEnvVars = [
    'APPWRITE_ENDPOINT',
    'APPWRITE_PROJECT_ID',
    'APPWRITE_API_KEY',
    'APPWRITE_BUCKET_VIDEO_CHUNKS',
    'APPWRITE_BUCKET_VIDEOS',
    'APPWRITE_DATABASE_ID',
    'APPWRITE_COLLECTION_UPLOAD_SESSIONS'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:', missingVars);
    throw new Error('Missing required environment variables');
}

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const storage = new Storage(client);
const databases = new Databases(client);

module.exports = {
    client,
    storage,
    databases,
    Query,
    InputFile, // Exporting this so upload-manager can use it
    BUCKET_CHUNKS: process.env.APPWRITE_BUCKET_VIDEO_CHUNKS,
    BUCKET_VIDEOS: process.env.APPWRITE_BUCKET_VIDEOS,
    DATABASE_ID: process.env.APPWRITE_DATABASE_ID,
    COLLECTION_UPLOAD_SESSIONS: process.env.APPWRITE_COLLECTION_UPLOAD_SESSIONS,
};