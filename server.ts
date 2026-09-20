import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Proxy endpoint for Loyverse API to bypass browser CORS constraints
app.get('/api/loyverse/test', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(400).json({ success: false, message: 'Falta encabezado de autorización' });
  }

  try {
    const loyverseRes = await fetch('https://api.loyverse.com/v1.0/receipts?limit=1', {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });

    if (loyverseRes.status === 401 || loyverseRes.status === 403) {
      return res.status(loyverseRes.status).json({
        success: false,
        message: 'Ficha de acceso inválida o sin permisos en Loyverse (401/403).'
      });
    }

    if (!loyverseRes.ok) {
      const errorText = await loyverseRes.text();
      return res.status(loyverseRes.status).json({
        success: false,
        message: `Error de Loyverse (HTTP ${loyverseRes.status}): ${errorText.slice(0, 100)}`
      });
    }

    return res.json({
      success: true,
      message: 'Conexión con Loyverse exitosa. Ficha de acceso válida.'
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: `Error al conectar con Loyverse desde el servidor: ${err?.message || 'Desconocido'}`
    });
  }
});

// Proxy endpoint to fetch receipts with pagination
app.get('/api/loyverse/receipts', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(400).json({ success: false, error: 'Falta encabezado de autorización' });
  }

  try {
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        queryParams.set(key, value);
      }
    }

    const loyverseUrl = `https://api.loyverse.com/v1.0/receipts?${queryParams.toString()}`;
    const loyverseRes = await fetch(loyverseUrl, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });

    const data = await loyverseRes.json();
    return res.status(loyverseRes.status).json(data);
  } catch (err: any) {
    return res.status(500).json({
      error: `Error al consultar Loyverse desde el servidor: ${err?.message || 'Desconocido'}`
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
