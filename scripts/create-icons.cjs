/**
 * 將白底 logo 轉成深色底 PWA icons 與 favicon
 * 執行：node scripts/create-icons.cjs
 */
const sharp = require('sharp');
const path  = require('path');

// 使用 src/assets 的方形版（無店名，作為 App icon 更簡潔）
const SRC = path.resolve('src/assets/logo.png');
// slate-950 = #020617
const BG  = { r: 2, g: 6, b: 23, alpha: 1 };

/**
 * @param {number} canvasSize  輸出圖示的邊長
 * @param {number} logoRatio   logo 佔畫布的比例
 * @param {string} outPath
 */
async function makeIcon(canvasSize, logoRatio, outPath) {
  const logoSize = Math.round(canvasSize * logoRatio);
  const pad      = Math.floor((canvasSize - logoSize) / 2);

  // Step 1：縮放 logo，取得原始 RGBA 像素
  const { data, info } = await sharp(SRC)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 255 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Step 2：把接近白色的像素設為透明（去白底）
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > 230 && data[i + 1] > 230 && data[i + 2] > 230) {
      data[i + 3] = 0;
    }
  }

  // Step 3：把處理後的像素轉回 PNG buffer
  const logoTransparent = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 }
  }).png().toBuffer();

  // Step 4：深色底圖 + 透明 logo 合成
  await sharp({
    create: { width: canvasSize, height: canvasSize, channels: 4, background: BG }
  })
    .composite([{ input: logoTransparent, top: pad, left: pad, blend: 'over' }])
    .png()
    .toFile(outPath);

  console.log('✓', outPath);
}

async function main() {
  await makeIcon(192, 0.72, 'public/icon-192.png');           // PWA standard
  await makeIcon(512, 0.60, 'public/icon-512.png');           // PWA maskable（留 safe zone）
  await makeIcon(180, 0.72, 'public/apple-touch-icon.png');   // iOS
  await makeIcon(64,  0.80, 'public/favicon-64.png');         // 瀏覽器分頁
  console.log('\n所有 icon 建立完成！');
}

main().catch(err => { console.error(err); process.exit(1); });
