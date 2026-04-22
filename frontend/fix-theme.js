import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  const replacements = [
    { regex: /\btext-white\b/g, rep: 'text-slate-900 dark:text-white' },
    { regex: /\btext-fleet-100\b/g, rep: 'text-slate-700 dark:text-fleet-100' },
    { regex: /\btext-fleet-200\b/g, rep: 'text-slate-500 dark:text-fleet-200' },
    { regex: /\btext-fleet-300\b/g, rep: 'text-slate-600 dark:text-fleet-300' },
    { regex: /\bbg-fleet-900\b/g, rep: 'bg-slate-50 dark:bg-fleet-900' },
    { regex: /\bbg-fleet-800\b/g, rep: 'bg-white dark:bg-fleet-800' },
    { regex: /\bbg-white\/5\b/g, rep: 'bg-white dark:bg-white/5' },
    { regex: /\bbg-white\/10\b/g, rep: 'bg-gray-50 dark:bg-white/10' },
    { regex: /\bborder-white\/10\b/g, rep: 'border-gray-200 dark:border-white/10' },
    { regex: /\bborder-white\/20\b/g, rep: 'border-gray-300 dark:border-white/20' },
  ];

  let modified = false;
  replacements.forEach(({ regex, rep }) => {
    if (regex.test(content)) {
      content = content.replace(regex, rep);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
}

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') && !fullPath.includes('Dashboard.tsx') && !fullPath.includes('MainLayout.tsx') && !fullPath.includes('TopBar.tsx')) {
      processFile(fullPath);
    }
  }
}

const targetDir = path.join(__dirname, 'src', 'pages');
processDirectory(targetDir);
console.log("Theme migration complete.");
