/**
 * map.js
 * Canvas rendering engine for the SmartRoute city map.
 *
 * Draws:
 *   • Background grid (city block pattern)
 *   • Road edges (normal, express, exploring, path)
 *   • Location nodes (colored by type, with state highlight)
 *   • Animated dashed overlay for the final path
 */

'use strict';

const canvas = document.getElementById('cityCanvas');
const ctx    = canvas.getContext('2d');

// Current visual state of each node / edge (keyed by id / edge-index)
let nodeState = {};   // 'default' | 'source' | 'dest' | 'exploring' | 'settled' | 'path'
let edgeState = {};   // 'default' | 'explore' | 'path'

// Animation dash offset (for the moving path animation)
let dashOffset = 0;
let rafId      = null;

// Edge lookup map: "from-to" → edge array index (built once)
const EDGE_MAP = (() => {
  const m = {};
  EDGES.forEach((e, i) => {
    m[`${e.from}-${e.to}`] = i;
    m[`${e.to}-${e.from}`] = i;
  });
  return m;
})();

// ── Canvas helpers ─────────────────────────────────────────────────
function W() { return canvas.width;  }
function H() { return canvas.height; }

/** Convert normalised node position → pixel coordinates */
function toPx(node) {
  return { x: node.nx * W(), y: node.ny * H() };
}

function resizeCanvas() {
  const area = canvas.parentElement.getBoundingClientRect();
  canvas.width  = area.width;
  canvas.height = area.height;
  render();
}
window.addEventListener('resize', resizeCanvas);

// ── Render ─────────────────────────────────────────────────────────
function render() {
  ctx.clearRect(0, 0, W(), H());

  drawBackground();
  drawEdges();
  drawNodes();
}

function drawBackground() {
  // Dark map background
  ctx.fillStyle = '#07101e';
  ctx.fillRect(0, 0, W(), H());

  // Subtle city-block grid
  ctx.strokeStyle = '#0b1a2e';
  ctx.lineWidth = 1;
  const step = Math.min(W(), H()) * 0.04;
  for (let x = 0; x < W(); x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H()); ctx.stroke();
  }
  for (let y = 0; y < H(); y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W(), y); ctx.stroke();
  }

  // Zone glows (very faint) behind each row
  drawZoneGlow(0.17, '#1e3a5f');   // North row
  drawZoneGlow(0.50, '#1a2a4a');   // Central row
  drawZoneGlow(0.83, '#122034');   // South row
}

function drawZoneGlow(ny, color) {
  const y   = ny * H();
  const grad = ctx.createLinearGradient(0, y - H()*0.14, 0, y + H()*0.14);
  grad.addColorStop(0,   'transparent');
  grad.addColorStop(0.5, color + '18');
  grad.addColorStop(1,   'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(0, y - H()*0.14, W(), H()*0.28);
}

// ── Draw Edges ─────────────────────────────────────────────────────
function drawEdges() {
  EDGES.forEach((e, i) => {
    const from = NODES[e.from];
    const to   = NODES[e.to];
    const fp   = toPx(from);
    const tp   = toPx(to);
    const state = edgeState[i] || 'default';

    let color, lw, dashed;
    if (state === 'path') {
      color  = '#fbbf24';
      lw     = 4;
      dashed = true;
    } else if (state === 'explore') {
      color  = '#38bdf8';
      lw     = 2.5;
      dashed = false;
    } else if (e.express) {
      color  = '#1e3a60';
      lw     = 2.5;
      dashed = false;
    } else {
      color  = '#132033';
      lw     = 2;
      dashed = false;
    }

    ctx.beginPath();
    ctx.moveTo(fp.x, fp.y);
    ctx.lineTo(tp.x, tp.y);
    ctx.strokeStyle = color;
    ctx.lineWidth   = lw;

    if (dashed) {
      ctx.setLineDash([14, 7]);
      ctx.lineDashOffset = -dashOffset;
    } else {
      ctx.setLineDash([]);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Road weight label
    drawEdgeLabel(e, fp, tp, state);
  });
}

function drawEdgeLabel(e, fp, tp, state) {
  const mx = (fp.x + tp.x) / 2;
  const my = (fp.y + tp.y) / 2;
  const val = (window.currentMode === 'km')
    ? e.km + ' km'
    : e.min + ' min';

  let textColor;
  if (state === 'path')    textColor = '#fbbf24';
  else if (state === 'explore') textColor = '#38bdf8';
  else                     textColor = '#1e3a60';

  const fontSize = Math.max(8, Math.min(10, W() * 0.01));
  ctx.font = `${fontSize}px Inter, sans-serif`;
  ctx.textAlign     = 'center';
  ctx.textBaseline  = 'middle';

  const tw = ctx.measureText(val).width + 6;
  ctx.fillStyle = '#07101e';
  ctx.fillRect(mx - tw / 2, my - 7, tw, 14);

  ctx.fillStyle = textColor;
  ctx.fillText(val, mx, my);
}

// ── Draw Nodes ─────────────────────────────────────────────────────
function drawNodes() {
  NODES.forEach(node => drawNode(node));
}

function drawNode(node) {
  const p     = toPx(node);
  const state = nodeState[node.id] || 'default';
  const meta  = TYPE_META[node.type];
  const r     = Math.min(W(), H()) * 0.027;   // node radius

  // State-driven colors
  let fill, border, textColor;
  if (state === 'source') {
    fill = '#451a03'; border = '#f59e0b'; textColor = '#fbbf24';
  } else if (state === 'dest') {
    fill = '#052e16'; border = '#34d399'; textColor = '#34d399';
  } else if (state === 'path') {
    fill = '#2d1a00'; border = '#fbbf24'; textColor = '#fde68a';
  } else if (state === 'exploring') {
    fill = '#0c2246'; border = '#38bdf8'; textColor = '#93c5fd';
  } else if (state === 'settled') {
    fill = '#063347'; border = '#22d3ee'; textColor = '#67e8f9';
  } else {
    fill = meta.bg; border = meta.color; textColor = meta.color;
  }

  // Glow ring (active states only)
  if (state !== 'default') {
    const g = ctx.createRadialGradient(p.x, p.y, r * 0.8, p.x, p.y, r * 2.8);
    g.addColorStop(0, border + '50');
    g.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 2.8, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
  }

  // Node circle
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fillStyle   = fill;
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth   = state !== 'default' ? 2.5 : 1.5;
  ctx.stroke();

  // Abbreviation text
  const abbr = node.abbr;
  const fs   = abbr.length > 1 ? r * 0.72 : r * 0.88;
  ctx.font          = `700 ${fs}px Inter, sans-serif`;
  ctx.fillStyle     = textColor;
  ctx.textAlign     = 'center';
  ctx.textBaseline  = 'middle';
  ctx.fillText(abbr, p.x, p.y - (state !== 'default' ? 5 : 2));

  // Short name tag below node
  if (state !== 'default') {
    // Show distance label
    ctx.font          = `600 ${Math.max(8, r * 0.52)}px Inter, sans-serif`;
    ctx.fillStyle     = textColor;
    ctx.textBaseline  = 'top';
    ctx.fillText(node.short, p.x, p.y + r + 3);
  } else {
    ctx.font          = `400 ${Math.max(7, r * 0.52)}px Inter, sans-serif`;
    ctx.fillStyle     = '#2d4a64';
    ctx.textBaseline  = 'top';
    ctx.fillText(node.short, p.x, p.y + r + 3);
  }
}

// ── Animation Loop ─────────────────────────────────────────────────
function startPathAnimation() {
  cancelAnimationFrame(rafId);
  function loop() {
    dashOffset = (dashOffset + 0.7) % 21;
    render();
    rafId = requestAnimationFrame(loop);
  }
  loop();
}

function stopAnimation() {
  cancelAnimationFrame(rafId);
  rafId = null;
}

// ── Visual State Helpers ───────────────────────────────────────────
function resetVisuals() {
  nodeState  = {};
  edgeState  = {};
  dashOffset = 0;
  stopAnimation();
  render();
}

function applyResult(result, srcId, dstId) {
  // Mark path nodes and edges
  result.path.forEach((nodeId, i) => {
    nodeState[nodeId] = 'path';
    if (i < result.path.length - 1) {
      const next = result.path[i + 1];
      const ei   = EDGE_MAP[`${nodeId}-${next}`];
      if (ei !== undefined) edgeState[ei] = 'path';
    }
  });

  // Override source/dest colors
  nodeState[srcId] = 'source';
  nodeState[dstId] = 'dest';

  startPathAnimation();
}
