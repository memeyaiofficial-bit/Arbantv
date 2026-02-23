const { v4: uuidv4 } = require('uuid');

// Import InputFile DIRECTLY from the library to avoid import errors
const { InputFile } = require('node-appwrite/file');

const { 
    client,
    storage, 
    databases, 
    BUCKET_CHUNKS, 
    BUCKET_VIDEOS, 
    DATABASE_ID, 
    COLLECTION_UPLOAD_SESSIONS
} = require('../../config/appwrite');
const { mergeChunks, cleanupChunks } = require('../utils/chunk-merger');

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
const uploadSessions = new Map();

/**
 * Initialize a new upload session
 */
async function initUpload(userId, fileName, fileSize) {
    const sessionId = uuidv4();
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);
    
    const sessionData = {
        uploadId: sessionId,
        userId: userId,
        fileName: fileName,
        fileSize: fileSize,
        totalChunks: totalChunks,
        uploadedChunks: 0,
        status: 'in_progress'
    };
    
    await databases.createDocument(
        DATABASE_ID,
        COLLECTION_UPLOAD_SESSIONS,
        sessionId,
        sessionData
    );
    
    uploadSessions.set(sessionId, {
        ...sessionData,
        chunkIndices: new Set()
    });
    
    return {
        sessionId,
        chunkSize: CHUNK_SIZE,
        totalChunks
    };
}

/**
 * Upload a chunk
 */
// async function uploadChunk(uploadId, chunkIndex, buffer, userId) {
//     let session = uploadSessions.get(uploadId);
    
//     if (!session) {
//         const doc = await databases.getDocument(DATABASE_ID, COLLECTION_UPLOAD_SESSIONS, uploadId);
//         session = { ...doc, chunkIndices: new Set() };
//         uploadSessions.set(uploadId, session);
//     }
    
//     if (session.userId !== userId) throw new Error('Unauthorized');

//     const chunkFileName = `${uploadId}_chunk_${chunkIndex}`;
    
//     // Safety check: verify InputFile exists before calling fromBuffer
//     if (!InputFile) {
//         throw new Error("InputFile utility is missing from the Appwrite config import.");
//     }


//     // Fix: Wrap buffer in InputFile for SDK compatibility
//     await storage.createFile(
//         BUCKET_CHUNKS, 
//         'unique()', 
//         InputFile.fromBuffer(buffer, chunkFileName)
//     );
    
//     session.chunkIndices.add(Number(chunkIndex));
//     const isComplete = session.chunkIndices.size === session.totalChunks;

//     await databases.updateDocument(
//         DATABASE_ID, 
//         COLLECTION_UPLOAD_SESSIONS, 
//         uploadId, 
//         {
//             uploadedChunks: session.chunkIndices.size,
//             status: isComplete ? 'completed' : 'in_progress'
//         }
//     );
    
//     return { uploaded: true, completed: isComplete };
// }

async function uploadChunk(uploadId, chunkIndex, buffer, userId) {
    let session = uploadSessions.get(uploadId);
    
    if (!session) {
        const doc = await databases.getDocument(DATABASE_ID, COLLECTION_UPLOAD_SESSIONS, uploadId);
        session = { ...doc, chunkIndices: new Set() };
        uploadSessions.set(uploadId, session);
    }
    
    if (session.userId !== userId) throw new Error('Unauthorized');

    const chunkFileName = `${uploadId}_chunk_${chunkIndex}`;

    // USE THE HELPER PROPERLY
    const fileToUpload = InputFile.fromBuffer(buffer, chunkFileName);

    await storage.createFile(
        BUCKET_CHUNKS, 
        'unique()', 
        fileToUpload
    );
    
    session.chunkIndices.add(Number(chunkIndex));
    const isComplete = session.chunkIndices.size === session.totalChunks;

    await databases.updateDocument(
        DATABASE_ID, 
        COLLECTION_UPLOAD_SESSIONS, 
        uploadId, 
        {
            uploadedChunks: session.chunkIndices.size,
            status: isComplete ? 'completed' : 'in_progress'
        }
    );
    
    return { uploaded: true, completed: isComplete };
}
/**
 * Complete upload by merging chunks and generating playback URL
 */
async function completeUpload(uploadId, userId) {
    const session = await databases.getDocument(DATABASE_ID, COLLECTION_UPLOAD_SESSIONS, uploadId);
    
    if (!session) throw new Error('Upload session not found');
    if (session.userId !== userId) throw new Error('Unauthorized');

    // 1. Merge
    const finalFile = await mergeChunks(uploadId, BUCKET_VIDEOS, session.fileName);
    
    // 2. Cleanup
    await cleanupChunks(uploadId);
    
    // 3. Construct Playback URL
    const endpoint = client.config.endpoint;
    const project = client.config.project;
    const playbackUrl = `${endpoint}/storage/buckets/${BUCKET_VIDEOS}/files/${finalFile.$id}/view?project=${project}`;

    // 4. Update DB
    await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_UPLOAD_SESSIONS,
        uploadId,
        {
            status: 'finalized',
            finalFileId: finalFile.$id,
            finalFileUrl: playbackUrl
        }
    );
    
    uploadSessions.delete(uploadId);
    
    return {
        sessionId: uploadId,
        fileId: finalFile.$id,
        playbackUrl: playbackUrl
    };
}

async function getStatus(uploadId, userId) {
    let session = uploadSessions.get(uploadId);
    if (!session) {
        session = await databases.getDocument(DATABASE_ID, COLLECTION_UPLOAD_SESSIONS, uploadId);
    }
    if (session.userId !== userId) throw new Error('Unauthorized');

    return {
        sessionId: uploadId,
        status: session.status,
        uploadedChunks: session.chunkIndices ? session.chunkIndices.size : session.uploadedChunks,
        totalChunks: session.totalChunks
    };
}

async function cancelUpload(uploadId, userId) {
    const session = await databases.getDocument(DATABASE_ID, COLLECTION_UPLOAD_SESSIONS, uploadId);
    if (session.userId !== userId) throw new Error('Unauthorized');

    await cleanupChunks(uploadId);
    await databases.deleteDocument(DATABASE_ID, COLLECTION_UPLOAD_SESSIONS, uploadId);
    uploadSessions.delete(uploadId);
}

module.exports = { initUpload, uploadChunk, completeUpload, getStatus, cancelUpload };