// Generates the PNG, ICO and social-image versions of U from the SVGs in public/brand/.
// Run after changing public/brand/u-mascot.svg or u-mark.svg:  node scripts/generate-brand-assets.mjs
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import sharp from "sharp";

const BG = "#f6f2ee"; // sg-bg (light)
const mark = readFileSync("public/brand/u-mark.svg");
const mascot = readFileSync("public/brand/u-mascot.svg");

const png = (svg, size) => sharp(svg, { density: 72 * Math.ceil(size / 64) * 2 }).resize(size, size).png().toBuffer();

/** The mark centred on an opaque sg-bg tile: app icons, where transparency renders black or white. */
async function tile(size, inset) {
    const inner = Math.round(size * (1 - inset * 2));
    return sharp({ create: { width: size, height: size, channels: 4, background: BG } })
        .composite([{ input: await png(mark, inner), gravity: "center" }])
        .png()
        .toBuffer();
}

/** An .ico holding PNG images (supported by every current browser). */
function ico(images) {
    const header = Buffer.alloc(6 + 16 * images.length);
    header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(images.length, 4);
    let offset = header.length;
    images.forEach(({ size, data }, i) => {
        const e = 6 + 16 * i;
        header.writeUInt8(size >= 256 ? 0 : size, e); header.writeUInt8(size >= 256 ? 0 : size, e + 1);
        header.writeUInt16LE(1, e + 4); header.writeUInt16LE(32, e + 6);
        header.writeUInt32LE(data.length, e + 8); header.writeUInt32LE(offset, e + 12);
        offset += data.length;
    });
    return Buffer.concat([header, ...images.map((i) => i.data)]);
}

// Reusable transparent PNGs.
writeFileSync("public/brand/u-mascot.png", await png(mascot, 512));
writeFileSync("public/brand/u-mark.png", await png(mark, 512));

// Browser and app icons.
writeFileSync("app/favicon.ico", ico(await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(mark, size) })))));
copyFileSync("public/brand/u-mark.svg", "app/icon.svg");
writeFileSync("app/apple-icon.png", await tile(180, 0.1));
writeFileSync("public/brand/icon-192.png", await tile(192, 0.1));
writeFileSync("public/brand/icon-512.png", await tile(512, 0.1));
writeFileSync("public/brand/icon-maskable-512.png", await tile(512, 0.2)); // content inside the 80% safe zone

// Social preview (1200x630): sg-bg with the coral and lavender glows, U and the name.
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="90"/></filter>
  </defs>
  <rect width="1200" height="630" fill="${BG}"/>
  <circle cx="160" cy="80" r="300" fill="rgb(255,170,140)" fill-opacity="0.55" filter="url(#b)"/>
  <circle cx="1080" cy="260" r="320" fill="rgb(176,160,255)" fill-opacity="0.45" filter="url(#b)"/>
  <g transform="translate(110,175) scale(4.4)">${mascot.toString().replace(/<\/?svg[^>]*>/g, "")}</g>
  <text x="460" y="300" font-family="Fraunces, Georgia, 'Times New Roman', serif" font-size="82" font-weight="600" fill="#1f1a26" letter-spacing="-2">Get Back To U</text>
  <text x="464" y="370" font-family="'Plus Jakarta Sans', Helvetica, Arial, sans-serif" font-size="34" fill="#5b5466">Practise the interview before it counts.</text>
  <text x="464" y="420" font-family="'Plus Jakarta Sans', Helvetica, Arial, sans-serif" font-size="34" fill="#5b5466">AI mock interviews, scored and explained.</text>
</svg>`;
writeFileSync("app/opengraph-image.png", await sharp(Buffer.from(og)).png().toBuffer());

console.log("brand assets written");
