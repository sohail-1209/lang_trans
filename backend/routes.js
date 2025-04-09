const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');
const { translateText } = require('./translate');
const fs = require('fs');

// Translate endpoint
router.post('/translate', async (req, res) => {
    const { text, language } = req.body;
    if (!text || !language) {
        return res.status(400).json({ error: 'Text and language are required' });
    }
    try {
        const translated = await translateText(text, language);
        db.run(`INSERT INTO history (text, translated, language) VALUES (?, ?, ?)`, [text, translated, language], (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ translated });
        });
    } catch (error) {
        res.status(500).json({ error: 'Translation failed' });
    }
});

// Fetch history
router.get('/history', (req, res) => {
    db.all(`SELECT * FROM history ORDER BY timestamp DESC`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Delete history
router.delete('/history/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM history WHERE id = ?`, id, function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Deleted successfully' });
    });
});

// Export history to a file
router.get('/export', (req, res) => {
    db.all(`SELECT * FROM history`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        const filePath = `./translations/history_${Date.now()}.json`;
        fs.writeFileSync(filePath, JSON.stringify(rows, null, 2));
        res.download(filePath);
    });
});

module.exports = router;
