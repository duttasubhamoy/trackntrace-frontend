const fs = require('fs');
const path = require('path');

// Generate a new version number based on timestamp
const version = new Date().getTime();

// Read the index.html file
const indexPath = path.join(__dirname, 'build', 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

// Add version to all .js and .css files
indexHtml = indexHtml.replace(/(?<=src="|href=")([^"]+\.(js|css))/g, `$1?v=${version}`);

// Write back to index.html
fs.writeFileSync(indexPath, indexHtml);

console.log(`Build versioned with timestamp: ${version}`);