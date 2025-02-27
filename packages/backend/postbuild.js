import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filePath = join(__dirname, 'dist', 'src', 'index.js');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /if \(require\.main === module\)/g,
  "if (import.meta.url === new URL(process.argv[1], 'file://').href)",
);

fs.writeFileSync(filePath, content, 'utf8');
