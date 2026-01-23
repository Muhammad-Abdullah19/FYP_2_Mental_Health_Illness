const https = require('https');

const API_KEY = 'AIzaSyBuJ4rSqjVS2R7WV0RXB9ozVgRGbd_DUO0';
const MODEL = 'gemini-flash-latest';
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const payload = JSON.stringify({
    contents: [
        {
            parts: [
                {
                    text: "Explain how AI works in a few words"
                }
            ]
        }
    ],
    generationConfig: {
        maxOutputTokens: 200,
    }
});

const options = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length
    }
};

const req = https.request(URL, options, (res) => {
    let data = '';

    console.log(`Status Code: ${res.statusCode}`);

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            console.log('Response:', JSON.stringify(response, null, 2));

            if (response.candidates && response.candidates[0] && response.candidates[0].content) {
                console.log('\nText Response:', response.candidates[0].content.parts[0].text);
            } else {
                console.error('Unexpected response structure');
            }

        } catch (e) {
            console.error('Error parsing response:', e);
            console.log('Raw data:', data);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.write(payload);
req.end();
