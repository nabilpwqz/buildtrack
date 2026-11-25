import fs from "fs";
import path from "path";

const imagesDir = path.resolve("public/images");
const files = fs.readdirSync(imagesDir).filter(f => f.endsWith(".svg") && !f.endsWith("-light.svg"));

console.log(`Processing ${files.length} 3D SVG project images with single-pass color replacement...`);

// High-contrast, rigorous single-pass mapping:
const colorMap = {
  // Dark canvas & plates -> Ivory & Warm Concrete
  "#0E0D0C": "#F4EFE6",
  "#171513": "#EBE5DB",
  "#211E1B": "#DFD8CC",
  "#2F2A25": "#D3CCC0",

  // Dark text & highlights -> Deep Graphite / Charcoal
  "#F4EFE6": "#171513",
  "#C9C3BB": "#3D3935",
  "#8C8782": "#6E6862",

  // Molten amber / high-contrast industrial accents
  "#FFB000": "#D99300",
  "#FF6A13": "#D94F05",
  "#E8C547": "#B8920C",
  "#E03131": "#C92A2A",
  "#B8602E": "#9E4E20",
};

// Regex that matches any of the hex codes (case-insensitive)
const colorRegex = new RegExp(
  Object.keys(colorMap).map(k => k.replace("#", "\\#")).join("|"),
  "gi"
);

for (const file of files) {
  const filePath = path.join(imagesDir, file);
  let content = fs.readFileSync(filePath, "utf8");

  const baseName = file.replace(".svg", "");
  // Replace gradient and pattern IDs so they never clash if both are referenced
  content = content.replace(new RegExp(`id="bg-${baseName}"`, "g"), `id="bg-${baseName}-light"`);
  content = content.replace(new RegExp(`id="glow-${baseName}"`, "g"), `id="glow-${baseName}-light"`);
  content = content.replace(new RegExp(`id="grid-${baseName}"`, "g"), `id="grid-${baseName}-light"`);
  content = content.replace(new RegExp(`url\\(#bg-${baseName}\\)`, "g"), `url(#bg-${baseName}-light)`);
  content = content.replace(new RegExp(`url\\(#glow-${baseName}\\)`, "g"), `url(#glow-${baseName}-light)`);
  content = content.replace(new RegExp(`url\\(#grid-${baseName}\\)`, "g"), `url(#grid-${baseName}-light)`);

  // Single-pass replacement function
  content = content.replace(colorRegex, (match) => {
    const upper = match.toUpperCase();
    return colorMap[upper] || match;
  });

  const lightFileName = file.replace(".svg", "-light.svg");
  const lightFilePath = path.join(imagesDir, lightFileName);
  fs.writeFileSync(lightFilePath, content, "utf8");
  console.log(`Generated: ${lightFileName}`);
}

console.log("All 12 light-mode 3D images generated successfully with single-pass precision!");
