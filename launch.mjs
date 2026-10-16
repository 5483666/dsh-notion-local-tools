#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { existsSync, realpathSync, rmSync } from 'node:fs';
import { mkdtemp, writeFile, rm, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { normalizeBaseURL } from './adapter.mjs';

export function findDshEntry(env = process.env) {
  if (env.DSH_CLI_ENTRY && existsSync(env.DSH_CLI_ENTRY)) return env.DSH_CLI_ENTRY;
  for (const dir of (env.PATH ?? '').split(delimiter).filter(Boolean)) {
    for (const shim of ['dsh', 'dsh.cmd']) {
      const path = join(dir, shim);
      if (!existsSync(path)) continue;
      const resolved = realpathSync(path);
      if (/\.[cm]?js$/.test(resolved)) return resolved;
      for (const candidate of [
        join(dir, 'node_modules/@deepseek-ai/dsh/lib/bin.js'),
        join(dir, '../lib/node_modules/@deepseek-ai/dsh/lib/bin.js'),
      ]) if (existsSync(candidate)) return realpathSync(candidate);
    }
  }
  throw new Error('找不到 DSH CLI，请先安装 DSH 并确保 dsh 在 PATH 中；也可设置 DSH_CLI_ENTRY 为其 lib/bin.js 路径。');
}

export function parseArgs(args) {
  const options = { profile: 'web', port: undefined, noOpen: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dsh-profile') options.profile = args[++i];
    else if (args[i] === '--port') options.port = args[++i];
    else if (args[i] === '--no-open') options.noOpen = true;
    else throw new Error('用法：dsh-notion-local-tools [--dsh-profile web] [--port 3080] [--no-open]');
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(options.profile ?? '')) throw new Error('profile 名称无效');
  if (options.port !== undefined && (!/^\d+$/.test(options.port) || +options.port > 65535)) throw new Error('端口无效');
  return options;
}

export async function main(args = process.argv.slice(2)) {
  if (args.includes('--help')) {
    console.log('用法：dsh-notion-local-tools [--dsh-profile web] [--port 3080] [--no-open]\n输入地址与密钥后启动 DSH Web。密钥仅保留在本次进程环境中，每次启动重新输入。');
    return;
  }
  const options = parseArgs(args);
  const entry = findDshEntry();
  if (!process.stdin.isTTY) throw new Error('请在交互式终端运行，API key 不支持通过命令参数或管道传入。');
  console.log('Notion 本地工具启动向导。请先关闭同 profile 的 DSH 服务。');
  const visible = createInterface({ input: process.stdin, output: process.stdout });
  let baseURL;
  try { baseURL = normalizeBaseURL(await visible.question('notion2api 请求地址：')); }
  finally { visible.close(); }
  // Readline keeps its normal terminal editing while the secret output is muted.
  const silentOutput = new Writable({ write(_chunk, _encoding, done) { done(); } });
  silentOutput.isTTY = true;
  silentOutput.columns = process.stdout.columns ?? 80;
  process.stdout.write('API key（输入不回显，仅用于本次运行）：');
  const hidden = createInterface({ input: process.stdin, output: silentOutput, terminal: true });
  let key;
  try { key = (await hidden.question('')).trim(); }
  finally { hidden.close(); process.stdout.write('\n'); }
  if (!key || /\s/.test(key)) throw new Error('API key 不能为空或包含空白');
  const dir = await mkdtemp(join(tmpdir(), 'dsh-notion-local-tools-'));
  await chmod(dir, 0o700);
  const cleanupOnExit = () => rmSync(dir, { recursive: true, force: true });
  process.once('exit', cleanupOnExit);
  const patch = join(dir, 'session.patch.json');
  try {
    await writeFile(patch, JSON.stringify([{
      id: 'notion-local-tools-adapter',
      config: { baseURL, apiKeyEnv: 'DSH_NOTION_LOCAL_TOOLS_SESSION_KEY' },
    }]), { mode: 0o600 });
    const childArgs = [entry, '--profile', options.profile, '--patch', patch];
    if (options.port !== undefined) childArgs.push('--port', options.port);
    if (options.noOpen) childArgs.push('--no-open');
    console.log('正在启动 DSH；选择“Notion · 本地工具”中的模型即可。关闭本终端会结束服务。');
    const child = spawn(process.execPath, childArgs, {
      stdio: 'inherit', shell: false,
      env: { ...process.env, DSH_NOTION_LOCAL_TOOLS_SESSION_KEY: key },
    });
    key = undefined;
    const onInterrupt = () => child.kill('SIGINT');
    const onTerminate = () => child.kill('SIGTERM');
    process.on('SIGINT', onInterrupt);
    process.on('SIGTERM', onTerminate);
    try {
      const code = await new Promise((resolve, reject) => {
        child.once('error', reject);
        child.once('exit', (code, signal) => resolve(code ?? (signal ? 130 : 1)));
      });
      process.exitCode = code;
    } finally {
      process.off('SIGINT', onInterrupt);
      process.off('SIGTERM', onTerminate);
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
    process.off('exit', cleanupOnExit);
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(new URL(import.meta.url))) {
  main().catch(() => {
    // Do not echo raw errors: user input or child spawn details may contain private paths.
    console.error('启动失败：检查 DSH 安装、交互式终端、地址格式及端口占用。运行 --help 查看用法。');
    process.exitCode = 1;
  });
}
