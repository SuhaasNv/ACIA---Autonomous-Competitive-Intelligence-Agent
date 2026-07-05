import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const distDir = path.join(__dirname, 'dist');

app.use(express.static(distDir));

app.get('*', (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
});

const port = process.env.PORT || 4173;
app.listen(port, () => {
    console.log(`[Frontend] Serving dist/ on port ${port}`);
});
