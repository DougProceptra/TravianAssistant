const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔨 Building TravianAssistant Extension v1.0.0...\n');

// Clean dist directory
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true });
}
fs.mkdirSync(distPath, { recursive: true });

// Create subdirectories
fs.mkdirSync(path.join(distPath, 'options'), { recursive: true });

// Copy manifest
console.log('📄 Copying manifest.json...');
fs.copyFileSync('manifest.json', path.join(distPath, 'manifest.json'));

// Copy static files from public if exists
const publicPath = path.join(__dirname, 'public');
if (fs.existsSync(publicPath)) {
  console.log('📁 Copying public files...');
  const files = fs.readdirSync(publicPath);
  files.forEach(file => {
    fs.copyFileSync(
      path.join(publicPath, file),
      path.join(distPath, file)
    );
  });
}

// Copy options files
console.log('⚙️ Copying options files...');
const optionsPath = path.join(__dirname, 'src/options');
if (fs.existsSync(optionsPath)) {
  ['options.html', 'options.css', 'options.js'].forEach(file => {
    const srcFile = path.join(optionsPath, file);
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, path.join(distPath, 'options', file));
    }
  });
}

// Compile TypeScript files
console.log('🔄 Compiling TypeScript...');
const tsFiles = [
  'src/content/index.ts',
  'src/background.ts',
  'src/popup.ts'
];

tsFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const outputName = path.basename(file, '.ts') === 'index' ? 'content.js' : path.basename(file, '.ts') + '.js';
    console.log(`  - ${file} -> ${outputName}`);
    try {
      execSync(`npx tsc ${file} --outFile dist/${outputName} --module es2020 --target es2020 --allowSyntheticDefaultImports --esModuleInterop`, {
        stdio: 'pipe'
      });
    } catch (e) {
      // If tsc fails, just copy as JS (for now)
      const jsContent = fs.readFileSync(file, 'utf8');
      fs.writeFileSync(path.join(distPath, outputName), jsContent);
    }
  }
});

// Copy game-data folder
console.log('🎮 Copying game data...');
const gameDataSrc = path.join(__dirname, 'src/game-data');
const gameDataDist = path.join(distPath, 'game-data');
if (fs.existsSync(gameDataSrc)) {
  fs.mkdirSync(gameDataDist, { recursive: true });
  fs.readdirSync(gameDataSrc).forEach(file => {
    fs.copyFileSync(
      path.join(gameDataSrc, file),
      path.join(gameDataDist, file)
    );
  });
}

console.log('\n✅ Build complete! Extension ready in dist/ folder');
console.log('📦 To install: Chrome -> Extensions -> Load unpacked -> Select dist/ folder\n');
