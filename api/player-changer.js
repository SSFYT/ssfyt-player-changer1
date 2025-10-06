const micro = require('micro');
const { parse } = require('multiparty');
const { buffer } = require('micro');

// 🎯 Player Changing Logic
const PLAYER_ID_OFFSET = 16504; // 0x4078 ka Decimal value

const handler = async (req, res) => {
    // 1. CORS Headers: Failed to fetch theek karne ke liye
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request (CORS preflight)
    if (req.method === 'OPTIONS') {
        return micro.send(res, 200);
    }

    if (req.method !== 'POST') {
        return micro.send(res, 405, { error: 'Method Not Allowed' });
    }

    try {
        // Parse multipart form data
        const form = new parse({ autoFiles: true });
        const { fields, files } = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) return reject(err);
                resolve({ fields, files });
            });
        });

        // Check if file and player ID are present
        const uploadedFile = files.file && files.file[0];
        const selectedPlayer = fields.player && fields.player[0];

        if (!uploadedFile || !selectedPlayer) {
            return micro.send(res, 400, { error: 'File or Player ID is missing.' });
        }

        const playerNum = parseInt(selectedPlayer);
        if (isNaN(playerNum) || playerNum < 1 || playerNum > 10) {
            return micro.send(res, 400, { error: 'Invalid Player ID selected.' });
        }

        // Read the uploaded file buffer
        const fileBuffer = await buffer(req, { limit: '10mb' }); 
        const originalFileBuffer = uploadedFile.path ? require('fs').readFileSync(uploadedFile.path) : fileBuffer;

        // Check buffer length to prevent offset errors
        if (originalFileBuffer.length < PLAYER_ID_OFFSET + 1) {
            return micro.send(res, 400, { error: 'File size is too small to contain Player ID offset.' });
        }

        // 🎯 CHANGE LOGIC: 1 byte change at the specific offset
        const modifiedBuffer = Buffer.from(originalFileBuffer);
        
        // Player number ko seedhe 1-byte value mein likhna (e.g., Player 1 -> 0x01)
        modifiedBuffer.writeUInt8(playerNum, PLAYER_ID_OFFSET); 

        // 4. Response mein modified file wapas bhejna
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="Modified_Player_${playerNum}_Data.bytes"`);
        return micro.send(res, 200, modifiedBuffer);

    } catch (error) {
        console.error('API Error:', error);
        return micro.send(res, 500, { error: 'Internal Server Error during processing: ' + error.message });
    }
};

module.exports = handler;
