const { spawn } = require('child_process');
const path = require('path');

console.log('\x1b[36m%s\x1b[0m', '================================================');
console.log('\x1b[35m%s\x1b[0m', '   EduPortal: Starting Backend & Frontend...    ');
console.log('\x1b[36m%s\x1b[0m', '================================================\n');

// 1. Start Django Backend on port 8000
const backend = spawn('python manage.py runserver 8000', {
  cwd: path.join(__dirname, 'backend'),
  env: { ...process.env, DJANGO_DEBUG: 'True' },
  shell: true,
  stdio: 'pipe'
});

backend.stdout.on('data', (data) => {
  process.stdout.write(`\x1b[34m[BACKEND]\x1b[0m ${data}`);
});

backend.stderr.on('data', (data) => {
  process.stderr.write(`\x1b[33m[BACKEND]\x1b[0m ${data}`);
});

// 2. Start React Frontend on port 5173
const frontend = spawn('npm run dev', {
  cwd: path.join(__dirname, 'frontend'),
  shell: true,
  stdio: 'pipe'
});

frontend.stdout.on('data', (data) => {
  process.stdout.write(`\x1b[32m[FRONTEND]\x1b[0m ${data}`);
});

frontend.stderr.on('data', (data) => {
  process.stderr.write(`\x1b[31m[FRONTEND]\x1b[0m ${data}`);
});

function cleanup() {
  console.log('\n\x1b[33m%s\x1b[0m', 'Shutting down EduPortal servers...');
  if (process.platform === 'win32') {
    if (backend.pid) spawn(`taskkill /pid ${backend.pid} /f /t`, { shell: true });
    if (frontend.pid) spawn(`taskkill /pid ${frontend.pid} /f /t`, { shell: true });
  } else {
    backend.kill();
    frontend.kill();
  }
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
