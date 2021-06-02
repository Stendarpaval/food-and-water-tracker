var fs = require('fs');
console.log(JSON.parse(fs.readFileSync('./food-and-water-tracker/module.json', 'utf8')).version);