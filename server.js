require('dotenv').config(); // Load environment variables
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const { Translate } = require('@google-cloud/translate').v2;

const app = express();
const db = new sqlite3.Database('./translations.db');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("./public"))

// Google Translate client setup
const translate = new Translate({ key: process.env.GOOGLE_API_KEY });

// Create translations table if not exists
db.run(`CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT,
    translated TEXT,
    language TEXT
)`);

// Translate API
app.post('/api/translate', async (req, res) => {
    const { text, language, inputLanguage } = req.body;

    if (!text || !language) {
        console.log("⚠ Missing text or language in request!");
        return res.status(400).json({ error: "Text and language are required" });
    }

    try {
        const detectedLanguage = inputLanguage === "auto" ? 'auto' : inputLanguage;
        const [translation] = await translate.translate(text, { from: detectedLanguage, to: language });

        console.log(`Translated: "${text}" → "${translation}" (${language})`);

        db.run(
            "INSERT INTO history (text, translated, language) VALUES (?, ?, ?)",
            [text, translation, language],
            function (err) {
                if (err) {
                    console.error("❌ DB Insert Error:", err.message);
                    return res.status(500).json({ error: err.message });
                }
                console.log("✅ Successfully inserted into database!");
                res.json({ translated: translation, detectedLanguage });
            }
        );
    } catch (error) {
        console.error("❌ Translation Error:", error);
        res.status(500).json({ error: "Translation service failed" });
    }
});

// Get translation history
app.get('/api/history', (req, res) => {
    db.all('SELECT * FROM history', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Delete translation history entry
app.delete('/api/history/:id', (req, res) => {
    const id = req.params.id;

    db.run('DELETE FROM history WHERE id = ?', [id], function (err) {
        if (err) {
            console.error("❌ DB Delete Error:", err.message);
            return res.status(500).json({ error: err.message });
        }

        if (this.changes === 0) {
            return res.status(404).json({ deleted: false, message: 'Entry not found' });
        }

        console.log("🗑 Deleted history entry with ID: ${id}");
        res.json({ deleted: true });
    });
});

// Export history as .txt
app.get('/api/export', (req, res) => {
    db.all('SELECT * FROM history', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        let exportContent = "Translation History:\n\n";
        rows.forEach(entry => {
            exportContent += `${entry.text} → ${entry.translated} (${entry.language})\n`;
        });

        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', 'attachment; filename=translation_history.txt');
        res.send(exportContent);
    });
});

const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server running on port http://localhost:${PORT}`));