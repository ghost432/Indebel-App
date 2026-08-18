const fs = require('fs');
const path = require('path');

const pagesDir = './frontend/src/pages';
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));

for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  let modified = false;
  
  // Replace response.data.data with (response.data?.data || response.data)
  // This regex matches any variable ending with Res or response, followed by .data.data
  const regex = /([a-zA-Z0-9]+)\.data\.data/g;
  
  const newContent = content.replace(regex, (match, p1) => {
    return `(${p1}.data?.data || ${p1}.data)`;
  });
  
  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Fixed', file);
  }
}
console.log('Done');
