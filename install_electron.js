const fs = require('fs');
const path = require('path');
const extract = require('extract-zip');
const { downloadArtifact } = require('@electron/get');

const version = '31.7.7'; // Matches package-lock/install.js version or package.json
const cachePath = 'C:\\Users\\1\\AppData\\Local\\electron\\Cache\\c94f2fc32e1fb05767f75322ea533eeb9828155f017ec184140930a3ec825e81\\electron-v31.7.7-win32-x64.zip';
const targetDir = path.join(__dirname, 'node_modules', 'electron', 'dist');

async function run() {
  console.log('Starting manual extraction...');
  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    console.log(`Extracting ${cachePath} to ${targetDir}...`);
    await extract(cachePath, { dir: targetDir });
    
    console.log('Writing path.txt...');
    fs.writeFileSync(path.join(__dirname, 'node_modules', 'electron', 'path.txt'), 'electron.exe');
    
    console.log('Writing version...');
    fs.writeFileSync(path.join(targetDir, 'version'), 'v' + version);
    
    console.log('Electron extraction complete successfully!');
  } catch (err) {
    console.error('Error during extraction:', err);
  }
}

run();
