const express = require('express');
const app = express();

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

const PORT = 5002;
app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
});