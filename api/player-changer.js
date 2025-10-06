const { send } = require('micro');
const formidable = require('formidable');
const fs = require('fs');
const PLAYER_ID_OFFSET = 16504; // Hex 0x4078 ka Decimal

const handler = async (req, res) => {
    // 1. CORS Headers (Failed to fetch ko theek karne ke liye)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return send(res, 200);
    }

    if (req.method !== 'POST') {
        return send(res, 405, { error: 'Method Not Allowed' });
    }

    try {
        // Formidable se file aur fields ko read karna
        const form = formidable({});
        
        // Asynchronous parsing ka istemal
        const { fields, files } = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) {
                    console.error('Form Parsing Error:', err);
                    return reject(new Error('Failed to parse form data.'));
                }
                resolve({ fields, files });
            });
        });

        const uploadedFile = files.file && files.file[0];
        const selectedPlayer = fields.player && fields.player[0];

        if (!uploadedFile || !selectedPlayer) {
            return send(res, 400, { error: 'File or Player ID is missing.' });
        }

        const playerNum = parseInt(selectedPlayer[0]); 
        
        // 2. File Buffer ko padhna
        const originalFileBuffer = fs.readFileSync(uploadedFile.filepath);

        if (originalFileBuffer.length < PLAYER_ID_OFFSET + 1) {
            return send(res, 400, { error: 'File size is too small.' });
        }

        // 3. 🎯 CHANGE LOGIC: 1 byte change at the specific offset (16504)
        const modifiedBuffer = Buffer.from(originalFileBuffer);
        modifiedBuffer.writeUInt8(playerNum, PLAYER_ID_OFFSET); 

        // 4. Response mein modified file wapas bhejna
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="Modified_Player_${playerNum}_Data.bytes"`);
        
        // Vercel mein 'micro' ke through buffer return karna
        return send(res, 200, modifiedBuffer);

    } catch (error) {
        console.error('API Final Error:', error.message);
        return send(res, 500, { error: 'Internal Server Error during file processing: ' + error.message });
    }
};

module.exports = handler;        if (!uploadedFile || !selectedPlayer) {
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
