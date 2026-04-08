const fs = require('fs');
const path = require('path');

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

function rmDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    fs.statSync(fullPath).isDirectory() ? rmDir(fullPath) : fs.unlinkSync(fullPath);
  }
  fs.rmdirSync(dir);
}

function rmFile(file) {
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

console.log('Building for Vercel (in-place)...');

rmFile('server.py');
rmFile('requirements.txt');

if (fs.existsSync('api')) {
  fs.renameSync('api', 'apic');
}

const replacements = [
  ["from '../api/", "from '../apic/"],
  ['from "../api/', 'from "../apic/'],
  ["from './api/", "from './apic/"],
  ['from "./api/', 'from "./apic/'],
];
replaceInDir('.', replacements, ['.js', '.html', '.mjs']);

fs.mkdirSync('api', { recursive: true });
fs.mkdirSync('api/v2/proxy', { recursive: true });

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
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

if (fs.existsSync('vercel-api')) {
  copyDir('vercel-api', 'api');
}

rmDir('vercel-api');
rmDir('models');
rmDir('tools');
rmFile('Dockerfile');
rmFile('.dockerignore');
rmFile('railway.json');
rmFile('render.yaml');
rmFile('build-vercel.js');

console.log('Vercel build complete!');
