const { google } = require('googleapis');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
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

        // Clean the message (remove feedback UI text)
        const cleanMessage = feedback.message
            .replace('Was this helpful?', '')
            .replace('👍', '')
            .replace('👎', '')
            .trim();

        const row = [
            new Date().toISOString(),
            feedback.user?.name || 'Anonymous',
            feedback.user?.email || '',
            feedback.sessionId,
            cleanMessage,
            feedback.feedback,
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: `${process.env.FEEDBACK_SHEET_NAME}!A:F`,
            valueInputOption: 'RAW',
            resource: { values: [row] }
        });

        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ success: true })
        };
        
    } catch (error) {
        console.error('Feedback error:', error);
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: error.message })
        };
    }
};