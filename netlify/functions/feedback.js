const { google } = require('googleapis');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const feedback = JSON.parse(event.body);
        
        // Initialize Google Sheets
        const sheets = google.sheets({ 
            version: 'v4', 
            auth: process.env.GOOGLE_SHEETS_API_KEY 
        });

        // Prepare row data
        const row = [
            new Date().toISOString(),      // Timestamp
            feedback.user?.name || 'Anonymous',  // User name
            feedback.user?.email || '',    // User email
            feedback.sessionId,            // Session ID
            feedback.message,              // AI response that was rated
            feedback.feedback,             // helpful or not-helpful
        ];

        // Append to Google Sheet
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: `${process.env.FEEDBACK_SHEET_NAME}!A:F`,
            valueInputOption: 'RAW',
            resource: {
                values: [row]
            }
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