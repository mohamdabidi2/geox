
const fs = require('fs');
const path = require('path');

// Create a simple 1x1 pixel transparent PNG
const defaultImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const defaultPhotoPath = path.join(uploadsDir, 'default.jpg');
fs.writeFileSync(defaultPhotoPath, defaultImage);

console.log('Default photo created successfully');