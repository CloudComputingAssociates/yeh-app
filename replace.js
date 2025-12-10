const fs = require('fs');
const path = require('path');

// Get the main.js file from dist/yeh-app/browser (Angular 17+ output structure)
const distPath = path.join('dist', 'yeh-app', 'browser');
const files = fs.readdirSync(distPath);
const mainJsFile = files.find(f => f.startsWith('main') && f.endsWith('.js'));

if (mainJsFile) {
  const filePath = path.join(distPath, mainJsFile);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace placeholders with environment variables
  content = content.replace('___AUTH0_DOMAIN___', process.env.AUTH0_DOMAIN || '');
  content = content.replace('___AUTH0_CLIENT_ID___', process.env.AUTH0_CLIENT_ID || '');
  content = content.replace('___AUTH0_AUDIENCE___', process.env.AUTH0_AUDIENCE || '');

  fs.writeFileSync(filePath, content);
  console.log('Environment variables injected successfully into', mainJsFile);
} else {
  console.error('Could not find main.js file in', distPath);
  console.log('Available files:', files);
  process.exit(1);
}
