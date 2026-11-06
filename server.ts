import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleApiRoute } from './src/server/apiHandler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// API and Notebook download routes handled via apiHandler
app.all(['/api/*', '/edgegen_colab_gpu_server.ipynb'], async (req, res) => {
  try {
    await handleApiRoute(req, res);
  } catch (err: any) {
    console.error('Server API error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  }
});

// Serve frontend static build files
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// SPA fallback: any other request serves index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 EdgeGen AI production server running at http://0.0.0.0:${PORT}`);
});
