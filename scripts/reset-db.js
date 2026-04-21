const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, '..', 'db.seed.json');
const target = path.join(__dirname, '..', 'db.json');

fs.copyFileSync(source, target);
console.log('Database reset from seed file.');
