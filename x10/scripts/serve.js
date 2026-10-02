// Zero-dependency static server for dist/. Use it when the browser blocks the
// speaker view from file:// (open http://localhost:8080 and press S).
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const port = Number(process.env.PORT) || 8080;
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.wav': 'audio/wav', '.ogg': 'audio/ogg',
  '.json': 'application/json', '.woff2': 'font/woff2',
};

createServer(async (req, res) => {
  try {
    const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = normalize(join(root, url));
    if (!file.startsWith(root)) throw new Error('outside root');
    if ((await stat(file)).isDirectory()) {
      // /presentacion -> /presentacion/ so the deck's relative paths resolve
      if (!url.endsWith('/')) {
        res.writeHead(301, { Location: url + '/' });
        res.end();
        return;
      }
      file = join(file, 'index.html');
    }
    const body = await readFile(file);
    const range = req.headers.range;
    const type = types[extname(file).toLowerCase()] || 'application/octet-stream';
    if (range && /^bytes=/.test(range)) {
      // Videos need range requests to seek.
      const [s, e] = range.replace('bytes=', '').split('-');
      const start = Number(s) || 0;
      const end = e ? Number(e) : body.length - 1;
      res.writeHead(206, {
        'Content-Type': type,
        'Content-Range': `bytes ${start}-${end}/${body.length}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
      });
      res.end(body.subarray(start, end + 1));
      return;
    }
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': body.length, 'Accept-Ranges': 'bytes' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('No encontrado');
  }
}).listen(port, () => {
  console.log(`x10 lista en http://localhost:${port}  (Ctrl+C para detener)`);
});
