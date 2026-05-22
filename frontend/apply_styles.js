import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pagesDir = path.join(__dirname, 'src', 'pages');

const replacements = [
  // Cards
  { regex: /bg-white\s+p-[468]\s+rounded-(xl|2xl)\s+border\s+border-slate-[12]00\s+shadow-(sm|md)/g, replacement: 'crm-card' },
  { regex: /bg-white\s+p-[468]\s+rounded-(xl|2xl)\s+shadow-(sm|md)\s+border\s+border-slate-[12]00/g, replacement: 'crm-card' },
  { regex: /bg-white\s+rounded-(xl|2xl)\s+shadow-(sm|md)\s+border\s+border-slate-[12]00\s+p-[468]/g, replacement: 'crm-card' },
  
  // Headers
  { regex: /text-3xl\s+font-extrabold\s+text-slate-900\s+tracking-tight/g, replacement: 'crm-h1' },
  { regex: /text-2xl\s+font-extrabold\s+text-slate-900\s+tracking-tight/g, replacement: 'crm-h1' },
  { regex: /text-2xl\s+font-bold\s+text-slate-900/g, replacement: 'crm-h1' },
  { regex: /text-xl\s+font-extrabold\s+text-slate-900\s+tracking-tight/g, replacement: 'crm-h2' },
  { regex: /text-lg\s+font-extrabold\s+text-slate-900\s+tracking-tight/g, replacement: 'crm-h3' },
  { regex: /text-lg\s+font-bold\s+text-slate-900/g, replacement: 'crm-h3' },
  
  // Body text
  { regex: /text-slate-500\s+font-medium\s+text-sm/g, replacement: 'crm-body mt-1' },
  { regex: /text-sm\s+text-slate-500/g, replacement: 'crm-body' },
  { regex: /text-xs\s+font-bold\s+text-slate-400\s+uppercase\s+tracking-wider/g, replacement: 'crm-caption' },
  { regex: /text-xs\s+font-bold\s+text-slate-500\s+uppercase\s+tracking-wider/g, replacement: 'crm-caption' },

  // Buttons
  { regex: /px-[456]\s+py-[23]\s+bg-indigo-600\s+text-white\s+rounded-(lg|xl)\s+text-sm\s+font-bold\s+shadow-(sm|md)\s+hover:bg-indigo-700/g, replacement: 'crm-btn-primary' },
  { regex: /px-[456]\s+py-[23]\s+bg-indigo-600\s+text-white\s+rounded-(lg|xl)\s+hover:bg-indigo-700\s+transition-colors/g, replacement: 'crm-btn-primary' },
  { regex: /bg-indigo-600\s+text-white\s+px-4\s+py-2\s+rounded-lg\s+hover:bg-indigo-700\s+transition-colors/g, replacement: 'crm-btn-primary' },
  
  { regex: /px-[456]\s+py-[23]\s+bg-white\s+border\s+border-slate-200\s+text-slate-700\s+rounded-(lg|xl)\s+text-sm\s+font-bold\s+hover:bg-slate-50/g, replacement: 'crm-btn-secondary' },
  { regex: /bg-white\s+border\s+border-slate-200\s+text-slate-700\s+px-4\s+py-2\s+rounded-lg\s+hover:bg-slate-50\s+transition-colors/g, replacement: 'crm-btn-secondary' },
  
  // Tables
  { regex: /w-full\s+text-left\s+border-collapse/g, replacement: 'crm-table' },
  { regex: /bg-slate-50\s+min-h-screen/g, replacement: '' }
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      
      for (const { regex, replacement } of replacements) {
        content = content.replace(regex, replacement);
      }
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated styles in: ${fullPath.replace(__dirname, '')}`);
      }
    }
  }
}

processDirectory(pagesDir);
console.log("Style replacement complete.");
