const fs = require('fs');
const path = require('path');

const targetDir = path.join(process.cwd(), 'public', 'seating');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const sourceDirs = [
  path.join(process.cwd(), 'attached_assets'),
  path.join(process.cwd(), 'assets')
];

let copiedCount = 0;

for (const dir of sourceDirs) {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (/\.(jpg|jpeg|png|webp)$/i.test(file)) {
        const srcPath = path.join(dir, file);
        const destPath = path.join(targetDir, file);
        try {
          fs.copyFileSync(srcPath, destPath);
          console.log(`[sync-seating] Copied ${file} from ${path.basename(dir)} to public/seating/`);
          copiedCount++;
        } catch (err) {
          console.error(`[sync-seating] Failed to copy ${file}:`, err);
        }
      }
    }
  }
}

console.log(`[sync-seating] Completed. Total images synced: ${copiedCount}`);
