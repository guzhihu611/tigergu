const fs = require('fs');
const path = require('path');

const DIST = 'dist';
const EXCLUDE = [
  '.git', '.vscode', 'venv', '__pycache__', 'node_modules',
  'dist', 'models', 'user', 'data', 'output', 'tools',
  'Dockerfile', '.dockerignore', 'railway.json', 'render.yaml',
  'build-vercel.js', 'vercel-api', '双击运行.bat',
  'server.py', 'requirements.txt'
];

function shouldExclude(name) {
  return EXCLUDE.includes(name) || name.endsWith('.pyc') || name.endsWith('.py');
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    if (shouldExclude(entry)) continue;
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function replaceInDir(dir, replacements, extensions) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      replaceInDir(fullPath, replacements, extensions);
    } else if (extensions.some(ext => entry.endsWith(ext))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      for (const [from, to] of replacements) {
        if (content.includes(from)) {
          content = content.replaceAll(from, to);
          modified = true;
        }
      }
      if (modified) fs.writeFileSync(fullPath, content);
    }
  }
}

console.log('Building for Vercel...');

if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true });
fs.mkdirSync(DIST);

copyDir('.', DIST);

const apiDir = path.join(DIST, 'api');
const apicDir = path.join(DIST, 'apic');
if (fs.existsSync(apiDir)) {
  fs.renameSync(apiDir, apicDir);
}

const replacements = [
  ["from '../api/", "from '../apic/"],
  ['from "../api/', 'from "../apic/'],
  ["from './api/", "from './apic/"],
  ['from "./api/', 'from "./apic/'],
];
replaceInDir(DIST, replacements, ['.js', '.html', '.mjs']);

fs.mkdirSync(path.join(DIST, 'api'), { recursive: true });

const vercelApiDir = path.join('.', 'vercel-api');
if (fs.existsSync(vercelApiDir)) {
  copyDir(vercelApiDir, path.join(DIST, 'api'));
}

console.log('Vercel build complete!');
