const { Translate } = require('@google-cloud/translate').v2;
require('dotenv').config();

const translate = new Translate({
    key: process.env.GOOGLE_TRANSLATE_API_KEY // Ensure your API key is in .env
});

async function translateText(text, targetLanguage) {
    try {
        let [translations] = await translate.translate(text, targetLanguage);
        return translations; // Return translated text
    } catch (error) {
        console.error('Google Translate API error:', error);
        return 'Translation error';
    }
}

module.exports = { translateText };
