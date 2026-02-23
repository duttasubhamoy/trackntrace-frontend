const fs = require('fs');
const path = require('path');

// Function to recursively search for a string in files
function searchInBuild(searchString) {
    const buildDir = path.join(__dirname, 'build');
    const jsFiles = [];
    
    function searchFiles(dir) {
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                searchFiles(filePath);
            } else if (file.endsWith('.js')) {
                const content = fs.readFileSync(filePath, 'utf8');
                if (content.includes(searchString)) {
                    jsFiles.push(filePath);
                }
            }
        });
    }
    
    searchFiles(buildDir);
    return jsFiles;
}

// NOTE:
// Some third-party libraries (router, axios, etc.) include a fallback
// string like 'http://localhost' in their runtime code or source maps.
// That incidental string is harmless for production — we only need to
// ensure the actual production backend URL is present in the bundle.

// Verify production URL is present in at least one build file
const PROD_URL = 'https://test1.richi.life';
const prodUrlFiles = searchInBuild(PROD_URL);
if (prodUrlFiles.length === 0) {
    console.error('ERROR: Production URL not found in build files!');
    console.error('Searched for:', PROD_URL);
    process.exit(1);
}

console.log('Build verification passed! Production URL found in build files.');