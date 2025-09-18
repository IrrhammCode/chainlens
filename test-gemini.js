const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

async function testGemini() {
    try {
        console.log('🔑 Testing Gemini API Key...');
        console.log('API Key:', process.env.GEMINI_API_KEY ? 'Set' : 'Not set');
        
        const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        console.log('🤖 Sending test request...');
        const result = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Hello, test message"
        });
        
        console.log('✅ Success! Response:', result.text);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Full error:', error);
    }
}

testGemini();
