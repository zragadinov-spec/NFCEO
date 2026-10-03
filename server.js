const express = require('express');
const { Pool } = require('pg');
const cors = require('cors'); 

const app = express();
// УВЕЛИЧИВАЕМ ЛИМИТ ДО 10 МЕГАБАЙТ ДЛЯ ФОТОГРАФИЙ
app.use(express.json({ limit: '10mb' }));
app.use(cors()); 

// Раздаем статические файлы (нашу визитку) из папки public
app.use(express.static('public'));

// 👇 ВСТАВЬТЕ СЮДА ВАШУ СТРОКУ ИЗ NEON ВМЕСТО МОЕЙ 👇
const connectionString = 'postgresql://neondb_owner:npg_4sBT7alfIend@ep-steep-sun-b1ay23zb-pooler.c-5.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false } 
});

pool.query('SELECT NOW()', (err, res) => {
    if (err) console.error('Ошибка подключения:', err.message);
    else console.log('✅ Успешно подключено к базе Neon!');
});

app.get('/api/profile/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const result = await pool.query('SELECT * FROM profiles WHERE username = $1', [username]);
        
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Профиль не найден" });
        res.json({ success: true, profile: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/save-profile', async (req, res) => {
    try {
        const { username, full_name, bio, links, avatar_url, banner_url } = req.body;
        
        const query = `
            INSERT INTO profiles (username, full_name, bio, links, avatar_url, banner_url) 
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (username) 
            DO UPDATE SET full_name = $2, bio = $3, links = $4, avatar_url = $5, banner_url = $6 
            RETURNING *;
        `;
        const values = [username, full_name, bio, JSON.stringify(links), avatar_url, banner_url];
        
        await pool.query(query, values);
        res.json({ success: true, message: "Успешно сохранено!" });
        
    } catch (err) {
        console.error("Ошибка сохранения:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(3000, () => {
    console.log('🚀 Сервер запущен на порту 3000. Жду запросов...');
});
