// This is a helper script to generate PWA icons
// You can run this with Node.js if you have the 'sharp' package installed
// npm install sharp
// node generate-icons.js

import sharp from 'sharp';
import fs from 'fs';

const sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];

// Create a simple Bible icon SVG
const iconSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7c3aed;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="80" fill="url(#grad)"/>
  <rect x="128" y="96" width="256" height="320" rx="16" fill="white"/>
  <rect x="144" y="112" width="224" height="4" rx="2" fill="#7c3aed"/>
  <rect x="144" y="128" width="224" height="4" rx="2" fill="#e5e7eb"/>
  <rect x="144" y="144" width="180" height="4" rx="2" fill="#e5e7eb"/>
  <rect x="144" y="160" width="200" height="4" rx="2" fill="#e5e7eb"/>
  <rect x="144" y="176" width="160" height="4" rx="2" fill="#e5e7eb"/>
  <rect x="144" y="200" width="224" height="4" rx="2" fill="#7c3aed"/>
  <rect x="144" y="216" width="190" height="4" rx="2" fill="#e5e7eb"/>
  <rect x="144" y="232" width="210" height="4" rx="2" fill="#e5e7eb"/>
  <rect x="144" y="248" width="170" height="4" rx="2" fill="#e5e7eb"/>
  <rect x="144" y="272" width="224" height="4" rx="2" fill="#7c3aed"/>
  <rect x="144" y="288" width="200" height="4" rx="2" fill="#e5e7eb"/>
  <rect x="144" y="304" width="180" height="4" rx="2" fill="#e5e7eb"/>
  <rect x="144" y="320" width="220" height="4" rx="2" fill="#e5e7eb"/>
  <rect x="144" y="336" width="160" height="4" rx="2" fill="#e5e7eb"/>
  <circle cx="256" cy="380" r="12" fill="#fbbf24"/>
  <text x="256" y="388" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">AI</text>
</svg>
`;

// Create icons directory if it doesn't exist
if (!fs.existsSync('./icons')) {
  fs.mkdirSync('./icons');
}

// Generate icons for each size
sizes.forEach(size => {
  sharp(Buffer.from(iconSvg))
    .resize(size, size)
    .png()
    .toFile(`./icons/icon-${size}x${size}.png`)
    .then(() => {
      console.log(`Generated icon-${size}x${size}.png`);
    })
    .catch(err => {
      console.error(`Error generating icon-${size}x${size}.png:`, err);
    });
});

console.log('Icon generation started. Make sure you have the sharp package installed: npm install sharp');