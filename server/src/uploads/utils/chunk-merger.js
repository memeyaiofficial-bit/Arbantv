// Import InputFile DIRECTLY to avoid the undefined error
const { InputFile } = require('node-appwrite/file'); 

// Import your config
const { storage, BUCKET_CHUNKS, BUCKET_VIDEOS } = require('../../config/appwrite');

async function mergeChunks(uploadId, bucketId, fileName) {
    try {
        console.log(`Starting merge for: ${fileName}`);

        // 1. List all files in the bucket
        const files = await storage.listFiles(BUCKET_CHUNKS);
        
        // Filter for this upload's chunks and sort them correctly
        const chunks = files.files
            .filter(file => file.name.startsWith(`${uploadId}_chunk_`))
            .sort((a, b) => {
                const idxA = parseInt(a.name.split('_chunk_')[1]);
                const idxB = parseInt(b.name.split('_chunk_')[1]);
                return idxA - idxB;
            });

        if (chunks.length === 0) throw new Error("No chunks found to merge");
        console.log(`Found ${chunks.length} chunks. Downloading...`);

        // 2. Download all chunks into memory
        const buffers = [];
        for (const chunk of chunks) {
            const buffer = await storage.getFileDownload(BUCKET_CHUNKS, chunk.$id);
            buffers.push(Buffer.from(buffer));
        }

        // 3. Combine all buffers
        const finalBuffer = Buffer.concat(buffers);
        console.log(`Chunks combined. Final size: ${finalBuffer.length} bytes.`);

        // 4. Upload the final merged file
        // This is where it was crashing before. Now we use the direct InputFile.
        const finalFile = await storage.createFile(
            BUCKET_VIDEOS,
            'unique()',
            InputFile.fromBuffer(finalBuffer, fileName)
        );

        console.log(`Successfully merged into file ID: ${finalFile.$id}`);
        return finalFile;
        
    } catch (error) {
        console.error('Merge error details:', error);
        throw error;
    }
}

async function cleanupChunks(uploadId) {
    try {
        console.log(`🧹 Starting cleanup for upload session: ${uploadId}`);
        
        // Fetch all files from the bucket
        const files = await storage.listFiles(BUCKET_CHUNKS);
        
        // Find ONLY the chunks belonging to this specific upload ID
        const chunksToDelete = files.files.filter(file => 
            file.name.includes(uploadId) && file.name.includes('_chunk_')
        );

        if (chunksToDelete.length === 0) {
            console.log("No chunks found to clean up.");
            return;
        }

        // Delete them one by one
        for (const chunk of chunksToDelete) {
            await storage.deleteFile(BUCKET_CHUNKS, chunk.$id);
            console.log(`✅ Deleted chunk: ${chunk.name}`);
        }

        console.log(`✨ Cleanup complete. ${chunksToDelete.length} chunks removed.`);
    } catch (error) {
        // We use warn here so a cleanup failure doesn't crash the whole upload process
        console.warn('⚠️ Cleanup warning:', error.message);
    }
}

module.exports = { mergeChunks, cleanupChunks };