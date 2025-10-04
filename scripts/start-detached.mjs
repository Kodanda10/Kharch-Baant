#!/usr/bin/env node
import { spawn } from 'node:child_process';
import fs from 'fs';

const out = fs.openSync('vite.out.log', 'a');
const err = fs.openSync('vite.err.log', 'a');

const child = spawn('npx', ['vite'], {
  stdio: ['ignore', out, err],
  detached: true,
  env: { ...process.env }
});

fs.writeFileSync('vite.pid', String(child.pid));
child.unref();
console.log(`[detached] Vite started PID=${child.pid} (logs: vite.out.log / vite.err.log)`);
