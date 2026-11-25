import fs from "fs";
import path from "path";

const imagesDir = path.resolve(process.cwd(), "public/images");
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

const projects = [
  {
    id: "metro-viaduct",
    title: "Dhaka Metro Rail Line 6 Viaduct",
    type: "Transit Infrastructure",
    accent: "#FFB000",
    pattern: "viaduct",
  },
  {
    id: "karnaphuli-tunnel",
    title: "Bangabandhu Sub-River Tunnel",
    type: "Underwater Marine Bore",
    accent: "#FF6A13",
    pattern: "tunnel",
  },
  {
    id: "padma-rail-link",
    title: "Padma Bridge Rail Link Corridor",
    type: "Heavy Rail & Truss",
    accent: "#B8602E",
    pattern: "truss",
  },
  {
    id: "bangabandhu-rail-bridge",
    title: "Bangabandhu Dual-Gauge Rail Bridge",
    type: "Steel Lattice Arch",
    accent: "#FFB000",
    pattern: "truss",
  },
  {
    id: "terminal-3-airport",
    title: "Airport Terminal 3 Expansion",
    type: "Aviation & Structural Glazing",
    accent: "#E8C547",
    pattern: "terminal",
  },
  {
    id: "matarbari-port",
    title: "Matarbari Deep Sea Port",
    type: "Maritime Marine Breakwater",
    accent: "#FF6A13",
    pattern: "port",
  },
  {
    id: "rooppur-civil",
    title: "Rooppur Civil Infrastructure",
    type: "Pre-stressed Concrete Containment",
    accent: "#8C8782",
    pattern: "reactor",
  },
  {
    id: "dhaka-expressway",
    title: "Dhaka Elevated Expressway Phase 2",
    type: "Precast Concrete Segmental Span",
    accent: "#FFB000",
    pattern: "viaduct",
  },
  {
    id: "payra-port",
    title: "Payra Multipurpose Terminal",
    type: "Piled Revetment & Gantry Wharf",
    accent: "#B8602E",
    pattern: "port",
  },
  {
    id: "sylhet-tamabil",
    title: "Sylhet-Tamabil Highway 4-Lane",
    type: "Heavy Asphalt Highway Corridor",
    accent: "#D9B98A",
    pattern: "highway",
  },
  {
    id: "chattogram-water",
    title: "Chattogram Water Treatment Complex",
    type: "Hydraulic Filtration & Pumping",
    accent: "#FF6A13",
    pattern: "hydraulics",
  },
  {
    id: "cox-rail-station",
    title: "Cox's Bazar Oyster Rail Terminal",
    type: "Architectural Shell Canopy",
    accent: "#E8C547",
    pattern: "canopy",
  },
];

for (const p of projects) {
  const svg = `<svg width="800" height="500" viewBox="0 0 800 500" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg-${p.id}" x1="0" y1="0" x2="800" y2="500" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0E0D0C" />
      <stop offset="50%" stop-color="#171513" />
      <stop offset="100%" stop-color="#211E1B" />
    </linearGradient>
    <linearGradient id="glow-${p.id}" x1="200" y1="100" x2="600" y2="400" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${p.accent}" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#0E0D0C" stop-opacity="0" />
    </linearGradient>
    <pattern id="grid-${p.id}" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2F2A25" stroke-width="0.8" />
    </pattern>
  </defs>

  <!-- Ground & Foundation -->
  <rect width="800" height="500" fill="url(#bg-${p.id})" />
  <rect width="800" height="500" fill="url(#grid-${p.id})" opacity="0.4" />
  <rect width="800" height="500" fill="url(#glow-${p.id})" />

  <!-- Horizon Ground Line -->
  <line x1="0" y1="380" x2="800" y2="380" stroke="#2F2A25" stroke-width="2" />
  <line x1="0" y1="384" x2="800" y2="384" stroke="${p.accent}" stroke-width="1" opacity="0.5" />

  <!-- Structural Elements -->
  ${
    p.pattern === "viaduct"
      ? `
    <!-- Piers & Elevated Girders -->
    <rect x="120" y="240" width="40" height="140" fill="#211E1B" stroke="#8C8782" stroke-width="2" />
    <rect x="380" y="240" width="40" height="140" fill="#211E1B" stroke="#8C8782" stroke-width="2" />
    <rect x="640" y="240" width="40" height="140" fill="#211E1B" stroke="#8C8782" stroke-width="2" />
    
    <!-- Box Girder Deck -->
    <polygon points="40,240 760,240 740,200 60,200" fill="#171513" stroke="${p.accent}" stroke-width="2" />
    <line x1="40" y1="210" x2="760" y2="210" stroke="#8C8782" stroke-width="1.5" stroke-dasharray="10 5" />
    
    <!-- Parapet & Rails -->
    <line x1="40" y1="195" x2="760" y2="195" stroke="#C9C3BB" stroke-width="3" />
    <rect x="360" y="160" width="80" height="35" fill="#FFB000" fill-opacity="0.1" stroke="#FFB000" stroke-width="1.5" />
    <text x="400" y="182" fill="#FFB000" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle">SPAN #04 ACTIVE</text>
    `
      : p.pattern === "tunnel"
      ? `
    <!-- Underwater Tunnel Tube Cross-Section -->
    <circle cx="400" cy="270" r="140" fill="#171513" stroke="#8C8782" stroke-width="6" />
    <circle cx="400" cy="270" r="125" fill="#0E0D0C" stroke="${p.accent}" stroke-width="3" />
    <line x1="280" y1="320" x2="520" y2="320" stroke="#8C8782" stroke-width="4" />
    <line x1="280" y1="324" x2="520" y2="324" stroke="#FFB000" stroke-width="1.5" stroke-dasharray="8 6" />
    
    <!-- Emergency Escape Cross-Passage & Lights -->
    <circle cx="400" cy="180" r="8" fill="${p.accent}" />
    <line x1="400" y1="140" x2="400" y2="170" stroke="#8C8782" stroke-width="2" />
    <text x="400" y="300" fill="#F4EFE6" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle">BORE DIA: 10.8m · -31m MSL</text>
    `
      : p.pattern === "truss"
      ? `
    <!-- Heavy Steel Lattice Truss Bridge -->
    <polygon points="80,380 180,180 320,380 440,180 580,380 720,180 760,380" fill="none" stroke="#8C8782" stroke-width="3" />
    <line x1="80" y1="380" x2="760" y2="380" stroke="${p.accent}" stroke-width="4" />
    <line x1="180" y1="180" x2="720" y2="180" stroke="${p.accent}" stroke-width="4" />
    <line x1="180" y1="180" x2="440" y2="180" stroke="#FF6A13" stroke-width="2" />
    
    <!-- Pylons & Counterbraces -->
    <line x1="180" y1="180" x2="180" y2="380" stroke="#C9C3BB" stroke-width="2" stroke-dasharray="4 4" />
    <line x1="440" y1="180" x2="440" y2="380" stroke="#C9C3BB" stroke-width="2" stroke-dasharray="4 4" />
    <line x1="720" y1="180" x2="720" y2="380" stroke="#C9C3BB" stroke-width="2" stroke-dasharray="4 4" />
    `
      : `
    <!-- Tower Crane & High Rise Skeleton -->
    <!-- Tower Mast -->
    <rect x="580" y="80" width="16" height="300" fill="#171513" stroke="${p.accent}" stroke-width="2" />
    <line x1="580" y1="80" x2="596" y2="120" stroke="#8C8782" stroke-width="1.5" />
    <line x1="596" y1="120" x2="580" y2="160" stroke="#8C8782" stroke-width="1.5" />
    <line x1="580" y1="160" x2="596" y2="200" stroke="#8C8782" stroke-width="1.5" />
    <line x1="596" y1="200" x2="580" y2="240" stroke="#8C8782" stroke-width="1.5" />
    <line x1="580" y1="240" x2="596" y2="280" stroke="#8C8782" stroke-width="1.5" />
    <line x1="596" y1="280" x2="580" y2="320" stroke="#8C8782" stroke-width="1.5" />
    <line x1="580" y1="320" x2="596" y2="360" stroke="#8C8782" stroke-width="1.5" />
    
    <!-- Jib & Counter-Jib -->
    <line x1="380" y1="80" x2="680" y2="80" stroke="${p.accent}" stroke-width="3" />
    <polygon points="580,45 596,45 588,25" fill="${p.accent}" />
    <line x1="588" y1="25" x2="400" y2="80" stroke="#C9C3BB" stroke-width="1.5" />
    <line x1="588" y1="25" x2="670" y2="80" stroke="#C9C3BB" stroke-width="1.5" />
    
    <!-- Hoist Cable & Hook -->
    <line x1="450" y1="80" x2="450" y2="220" stroke="#E8C547" stroke-width="1.5" stroke-dasharray="3 2" />
    <polygon points="445,220 455,220 450,230" fill="${p.accent}" />

    <!-- Rising Frame Structural Slabs -->
    <rect x="140" y="140" width="280" height="240" fill="#171513" stroke="#8C8782" stroke-width="2" />
    <line x1="140" y1="200" x2="420" y2="200" stroke="#FFB000" stroke-width="2" />
    <line x1="140" y1="260" x2="420" y2="260" stroke="#8C8782" stroke-width="2" />
    <line x1="140" y1="320" x2="420" y2="320" stroke="#8C8782" stroke-width="2" />
    <line x1="210" y1="140" x2="210" y2="380" stroke="#2F2A25" stroke-width="2" />
    <line x1="280" y1="140" x2="280" y2="380" stroke="#2F2A25" stroke-width="2" />
    <line x1="350" y1="140" x2="350" y2="380" stroke="#2F2A25" stroke-width="2" />
    `
  }

  <!-- Telemetry HUD Badge Overlay -->
  <rect x="40" y="40" width="320" height="70" rx="2" fill="#0E0D0C" fill-opacity="0.9" stroke="#2F2A25" stroke-width="1.5" />
  <rect x="40" y="40" width="4" height="70" fill="${p.accent}" />
  <text x="56" y="65" fill="#8C8782" font-family="monospace" font-size="10" font-weight="bold" letter-spacing="1">PROJECT TELEMETRY // SPEC-2026</text>
  <text x="56" y="85" fill="#F4EFE6" font-family="sans-serif" font-size="13" font-weight="bold">${p.title}</text>
  <text x="56" y="100" fill="${p.accent}" font-family="monospace" font-size="10">${p.type}</text>

  <!-- Industrial Compass / Scale Marker -->
  <rect x="700" y="420" width="60" height="24" fill="#0E0D0C" stroke="#2F2A25" stroke-width="1" />
  <text x="730" y="436" fill="#8C8782" font-family="monospace" font-size="9" text-anchor="middle">1:250 SCALE</text>
</svg>
`;

  fs.writeFileSync(path.join(imagesDir, `${p.id}.svg`), svg, "utf-8");
}

console.log(`Generated ${projects.length} project images in public/images/`);

