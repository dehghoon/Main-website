import { createCanvas } from "@napi-rs/canvas";

const WIDTH = 1200;
const HEIGHT = 630;

/** Generate a branded, original PNG cover from an article title. */
export function generateBlogCover(title: string): Buffer {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");
  const bg = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  bg.addColorStop(0, "#08182d");
  bg.addColorStop(1, "#163e63");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Structural grid illustration; decorative only, not an engineering model.
  ctx.strokeStyle = "rgba(75,191,225,0.26)";
  ctx.lineWidth = 2;
  for (let x = 720; x < 1200; x += 64) {
    ctx.beginPath(); ctx.moveTo(x, 90); ctx.lineTo(x, 570); ctx.stroke();
  }
  for (let y = 90; y <= 570; y += 64) {
    ctx.beginPath(); ctx.moveTo(720, y); ctx.lineTo(1200, y); ctx.stroke();
  }
  ctx.strokeStyle = "rgba(102,215,245,0.72)";
  ctx.lineWidth = 5;
  for (let i = 0; i < 4; i++) {
    const x = 780 + i * 110;
    ctx.beginPath(); ctx.moveTo(x, 510); ctx.lineTo(x, 175 - (i % 2) * 45); ctx.stroke();
  }
  for (let y = 260; y <= 510; y += 125) {
    ctx.beginPath(); ctx.moveTo(780, y); ctx.lineTo(1110, y); ctx.stroke();
  }

  ctx.fillStyle = "#6fe0f5";
  ctx.font = "bold 28px sans-serif";
  ctx.fillText("LINKOTEQ  /  ENGINEERING INSIGHTS", 72, 100);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 54px sans-serif";
  const words = title.replace(/[<>]/g, "").split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const proposed = current ? current + " " + word : word;
    if (ctx.measureText(proposed).width > 650 && current) {
      lines.push(current); current = word;
    } else current = proposed;
  }
  if (current) lines.push(current);
  const shown = lines.slice(0, 5);
  shown.forEach((line, i) => ctx.fillText(line, 72, 220 + i * 69, 655));
  ctx.fillStyle = "#6fe0f5";
  ctx.fillRect(72, 558, 300, 6);
  return canvas.toBuffer("image/png");
}
