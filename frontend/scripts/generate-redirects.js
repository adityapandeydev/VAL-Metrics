import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');
const redirectsFile = path.join(distDir, '_redirects');

// Read backend URL from private Netlify build environment variable
const rawBackendUrl = process.env.VITE_BACKEND_URL || process.env.BACKEND_URL;

let rules = '';

if (rawBackendUrl && rawBackendUrl.trim() !== '') {
  const trimmed = rawBackendUrl.trim().replace(/\/+$/, '');
  try {
    const parsed = new URL(trimmed);
    const origin = `${parsed.protocol}//${parsed.host}`;
    rules += `/api/*    ${origin}/api/:splat    200!\n`;
    console.log(`[generate-redirects] Injected dynamic Netlify API proxy -> ${origin}`);
  } catch {
    rules += `/api/*    ${trimmed}/api/:splat    200!\n`;
    console.log(`[generate-redirects] Injected dynamic Netlify API proxy -> ${trimmed}`);
  }
} else {
  console.log('[generate-redirects] No VITE_BACKEND_URL provided. Operating in static SPA mode.');
}

// Ensure Single Page Application catch-all route is present
rules += `/*        /index.html                           200\n`;

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

fs.writeFileSync(redirectsFile, rules, 'utf8');
console.log(`[generate-redirects] Successfully wrote ${redirectsFile}`);
