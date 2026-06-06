import { NextResponse } from 'next/server';

// Directories and files to exclude
const EXCLUDE_DIRS = new Set([
  'node_modules', '.next', '.git', 'db', 'dist', '.turbo', 'coverage', '.cache',
]);

const EXCLUDE_FILES = new Set([
  '.DS_Store', 'Thumbs.db', '.env', '.env.local',
  '.env.development.local', '.env.test.local', '.env.production.local',
]);

// CRC-32 table
const crcTable = (() => {
  const table: number[] = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  return table;
})();

function crc32(data: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xff];
  return (crc ^ 0xffffffff) >>> 0;
}

// Build a simple ZIP from pre-read buffers (stored, no compression)
function buildZip(files: { name: string; data: Buffer }[]): Buffer {
  const parts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBuf = Buffer.from(file.name, 'utf8');
    const data = file.data;
    const crc = crc32(data);
    const localLen = 30 + nameBuf.length + data.length;

    const local = Buffer.alloc(localLen);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8); // stored
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    nameBuf.copy(local, 30);
    data.copy(local, 30 + nameBuf.length);

    const central = Buffer.alloc(46 + nameBuf.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    nameBuf.copy(central, 46);

    parts.push(local);
    centralParts.push(central);
    offset += localLen;
  }

  const centralOffset = offset;
  let centralSize = 0;
  for (const c of centralParts) centralSize += c.length;

  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(centralOffset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...parts, ...centralParts, end]);
}

export async function GET() {
  try {
    const projectRoot = process.cwd();
    const { readdirSync, statSync, readFileSync } = await import('fs');
    const { join, relative } = await import('path');

    const filePaths: string[] = [];
    const MAX_FILE_SIZE = 200 * 1024; // 200KB max per file to keep memory low

    function scanDir(dir: string) {
      let items;
      try { items = readdirSync(dir, { withFileTypes: true }); } catch { return; }
      for (const item of items) {
        if (EXCLUDE_DIRS.has(item.name) || EXCLUDE_FILES.has(item.name)) continue;
        if (item.name.startsWith('.') && item.name !== '.env.example') continue;
        const fullPath = join(dir, item.name);
        if (item.isDirectory()) { scanDir(fullPath); }
        else if (item.isFile()) { filePaths.push(relative(projectRoot, fullPath)); }
      }
    }

    scanDir(join(projectRoot, 'src'));
    try { scanDir(join(projectRoot, 'prisma')); } catch { /* */ }
    try { scanDir(join(projectRoot, 'public')); } catch { /* */ }

    for (const file of ['package.json', 'tsconfig.json', 'next.config.ts', 'next.config.mjs',
      'postcss.config.mjs', 'tailwind.config.ts', '.env.example', 'README.md', 'Caddyfile']) {
      try { statSync(join(projectRoot, file)); filePaths.push(file); } catch { /* */ }
    }

    // Read files, skip large ones
    const files: { name: string; data: Buffer }[] = [];
    for (const fp of filePaths) {
      try {
        const full = join(projectRoot, fp);
        const stat = statSync(full);
        if (stat.size > MAX_FILE_SIZE) continue;
        files.push({ name: `reunifi-ai-source/${fp}`, data: readFileSync(full) });
      } catch { /* */ }
    }

    // Add README
    files.push({
      name: 'reunifi-ai-source/README-DOWNLOAD.txt',
      data: Buffer.from([
        '╔══════════════════════════════════════════════════════════════╗',
        '║                    REUNIFI AI SOURCE CODE                   ║',
        '║           AI-Powered Humanitarian Child Recovery Platform   ║',
        '╚══════════════════════════════════════════════════════════════╝',
        '',
        `Generated: ${new Date().toISOString()}`,
        '',
        'TECHNOLOGY STACK:',
        '  • Framework: Next.js 16 (App Router)',
        '  • Language: TypeScript 5',
        '  • Styling: Tailwind CSS 4 + shadcn/ui',
        '  • Database: Prisma ORM (SQLite)',
        '  • AI: VLM via z-ai-web-dev-sdk',
        '  • State Management: Zustand',
        '',
        'DEMO ACCOUNTS:',
        '  Admin:    admin@reunifi.ai / Admin@123',
        '  Police:   police@reunifi.ai / Police@123',
        '  NGO:      ngo@reunifi.ai / NGO@123',
        '  Parent:   parent@reunifi.ai / Parent@123',
        '',
        'GETTING STARTED:',
        '  1. bun install && bun run db:push && bun run dev',
        '',
        '© 2025 Reunifi AI',
      ].join('\n'), 'utf8'),
    });

    const zipBuffer = buildZip(files);

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="reunifi-ai-source.zip"',
        'Content-Length': zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('[Download Source] Error:', error);
    return NextResponse.json({ error: 'Failed to generate source code ZIP' }, { status: 500 });
  }
}
