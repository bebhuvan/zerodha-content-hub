const fs = require('fs');

// Create simple PNG icon data (black square with white Z)
// This is a minimal PNG structure for a 192x192 black icon
const icon192 = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
  0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
  0x00, 0x00, 0x00, 0xC0, 0x00, 0x00, 0x00, 0xC0, // Width: 192, Height: 192
  0x08, 0x02, 0x00, 0x00, 0x00, 0x9F, 0x92, 0x77, 0x7E, // Bit depth: 8, Color type: 2 (RGB)
  // ... rest of PNG data would be very long for a proper implementation
]);

// For now, let's create SVG files and rename them
const svg192 = `<svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
  <rect width="192" height="192" fill="#000000"/>
  <text x="96" y="120" font-family="Arial, sans-serif" font-size="96" font-weight="bold" fill="#FFFFFF" text-anchor="middle">Z</text>
</svg>`;

const svg512 = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#000000"/>
  <text x="256" y="320" font-family="Arial, sans-serif" font-size="256" font-weight="bold" fill="#FFFFFF" text-anchor="middle">Z</text>
</svg>`;

fs.writeFileSync('public/icon-192.svg', svg192);
fs.writeFileSync('public/icon-512.svg', svg512);

console.log('Created SVG icons');