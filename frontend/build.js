const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure we're in the right directory
const rootDir = process.cwd();

// Clean previous builds
if (fs.existsSync(path.join(rootDir, 'dist'))) {
  fs.rmSync(path.join(rootDir, 'dist'), { recursive: true, force: true });
}

// Build Next.js
execSync('npm run build', { stdio: 'inherit' });

// Create dist directory
fs.mkdirSync(path.join(rootDir, 'dist'), { recursive: true });

// Copy necessary files
const filesToCopy = [
  '.next',
  'public',
  'package.json',
  'server.js',
  'node_modules'
];

filesToCopy.forEach(file => {
  const source = path.join(rootDir, file);
  const dest = path.join(rootDir, 'dist', file);
  
  if (fs.existsSync(source)) {
    if (fs.lstatSync(source).isDirectory()) {
      fs.cpSync(source, dest, { recursive: true });
    } else {
      fs.copyFileSync(source, dest);
    }
  } else {
    console.warn(`Warning: ${file} not found`);
  }
});

// Create a minimal package.json for the dist folder
const packageJson = {
  name: "sellica-dist",
  version: "1.0.0",
  private: true,
  bin: "server.js",
  main: "server.js",
  dependencies: {
    "next": require('./package.json').dependencies.next,
    "react": require('./package.json').dependencies.react,
    "react-dom": require('./package.json').dependencies["react-dom"],
    "compression": "^1.7.4",
    "helmet": "^7.1.0"
  }
};

fs.writeFileSync(
  path.join(rootDir, 'dist', 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

// Verify the dist directory structure
const distDir = path.join(rootDir, 'dist');
const requiredFiles = ['.next', 'public', 'package.json', 'server.js', 'node_modules'];

requiredFiles.forEach(file => {
  const filePath = path.join(distDir, file);
  if (fs.existsSync(filePath)) {
  } else {
    console.error(`✗ ${file} is missing!`);
  }
});

// Run pkg
execSync('pkg . --targets node16-win-x64 --output dist/server.exe --public', { 
  stdio: 'inherit',
  cwd: path.join(rootDir, 'dist')
});

// Verify the executable was created
const exePath = path.join(rootDir, 'dist', 'server.exe');
if (fs.existsSync(exePath)) {
  console.log('Build completed successfully!');
  console.log('The executable is located at:', exePath);
  console.log('To run the application:');
  console.log('1. Navigate to the dist folder');
  console.log('2. Make sure the .next and public folders are present');
  console.log('3. Run server.exe');
} else {
  console.error('\nError: Executable was not created!');
  process.exit(1);
}