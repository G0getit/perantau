const { google } = require('googleapis');

exports.handler = async (event, context) => {
    // Handle CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': 'https://perantau.netlify.app',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            }
        };
    }

    if (event.httpMethod !== 'POST') {
        return { 
            statusCode: 405, 
            headers: { 'Access-Control-Allow-Origin': 'https://perantau.netlify.app' },
            body: 'Method Not Allowed' 
        };
    }

    try {
        const feedback = JSON.parse(event.body);
        
        // Parse service account credentials
        const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
        
        // Initialize auth
        const auth = new google.auth.GoogleAuth({
            credentials: serviceAccount,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        
        const sheets = google.sheets({ version: 'v4', auth });

        // Determine feedback type and prepare data accordingly
        let row;
        let sheetRange;

        if (feedback.type === 'user_feedback') {
            // Detailed user feedback - goes to main feedback sheet
            row = [
                new Date().toISOString(),
                feedback.user?.name || 'Anonymous',
                feedback.user?.email || '',
                feedback.sessionId,
                'USER_FEEDBACK', // Message type
                feedback.message, // The detailed feedback text
                'detailed_feedback' // Feedback type
            ];
            sheetRange = `${process.env.FEEDBACK_SHEET_NAME || 'Feedback'}!A:G`;
        } else {
            // Quick feedback (thumbs up/down) - goes to main feedback sheet
            // Clean the message (remove feedback UI text)
            const cleanMessage = feedback.message
                .replace('Was this helpful?', '')
                .replace('👍', '')
                .replace('👎', '')
                .trim();

            row = [
                new Date().toISOString(),
                feedback.user?.name || 'Anonymous',
                feedback.user?.email || '',
                feedback.sessionId,
                cleanMessage, // The AI response that was rated
                feedback.feedback, // 'helpful' or 'not-helpful'
                'quick_feedback' // Feedback type
            ];
            sheetRange = `${process.env.FEEDBACK_SHEET_NAME || 'Feedback'}!A:G`;
        }

        // Add the row to Google Sheets
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: sheetRange,
            valueInputOption: 'RAW',
            resource: { values: [row] }
        });

        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': 'https://perantau.netlify.app' },
            body: JSON.stringify({ 
                success: true,
                message: feedback.type === 'user_feedback' 
                    ? 'Thank you for your detailed feedback!' 
                    : 'Feedback recorded'
            })
        };
        
    } catch (error) {
        console.error('Feedback error:', error);
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': 'https://perantau.netlify.app' },
            body: JSON.stringify({ 
                error: 'Failed to save feedback',
                details: error.message 
            })
        };
    }
};