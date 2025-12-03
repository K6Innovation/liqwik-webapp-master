// scripts/setup-uploads.js
// Run this script once to create the uploads directory structure

const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'assets');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Uploads directory created successfully at:', uploadsDir);
} else {
  console.log('ℹ️  Uploads directory already exists');
}

// Create a .gitkeep file to preserve the directory structure in git
const gitkeepPath = path.join(uploadsDir, '.gitkeep');
fs.writeFileSync(gitkeepPath, '');
console.log('✅ .gitkeep file created');

console.log('\n🎉 Setup complete! You can now upload files.');