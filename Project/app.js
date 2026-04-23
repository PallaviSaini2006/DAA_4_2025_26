/**
 * app.js
 * UI controller for SmartRoute.
 * Wires together city-data, dijkstra, and map modules.
 */

'use strict';

// ── State ──────────────────────────────────────────────────────────
window.currentMode = 'km';     // 'km' | 'min'
let isRunning      = false;
let lastResult     = null;

// ── Initialise ─────────────────────────────────────────────────────
(function init() {
  const src = document.getElementById('srcSelect');
  const dst = document.getElementById('dstSelect');

  NODES.forEach(n => {
    src.appendChild(new Option(`${n.abbr}  ${n.name}`, n.id));
    dst.appendChild(new Option(`${n.abbr}  ${n.name}`, n.id));
  });

  // Resize and first draw
  resizeCanvas();
})();

// ── UI event handlers ──────────────────────────────────────────────
function onSelectChange() {
  updateFindBtn();
  resetVisuals();
  hideResults();

  const srcId = getSrc();
  const dstId = getDst();
  if (srcId !== null) nodeState[srcId] = 'source';
  if (dstId !== null) nodeState[dstId] = 'dest';
  render();
}

function setMode(m) {
  window.currentMode = m;
  document.getElementById('btnKm').classList.toggle('active',  m === 'km');
  document.getElementById('btnMin').classList.toggle('active', m === 'min');
  resetAll();
  // Redraw edge labels in new metric
  render();
}

function swapLocations() {
  const src = document.getElementById('srcSelect');
  const dst = document.getElementById('dstSelect');
  const tmp = src.value;
  src.value = dst.value;
  dst.value = tmp;
  onSelectChange();
}

function updateFindBtn() {
  const ok = getSrc() !== null && getDst() !== null && getSrc() !== getDst();
  document.getElementById('findBtn').disabled = !ok;
}

function getSrc() {
  const v = document.getElementById('srcSelect').value;
  return v === '' ? null : parseInt(v, 10);
}
function getDst() {
  const v = document.getElementById('dstSelect').value;
  return v === '' ? null : parseInt(v, 10);
}

// ── Route finding ──────────────────────────────────────────────────
async function findRoute() {
  const srcId = getSrc();
  const dstId = getDst();
  if (srcId === null || dstId === null) return;
  if (srcId === dstId) {
    setOverlay('⚠ Origin and destination must be different.');
    return;
  }

  if (isRunning) return;
  isRunning = true;
  document.getElementById('findBtn').disabled = true;
  stopAnimation();
  resetVisuals();

  nodeState[srcId] = 'source';
  nodeState[dstId] = 'dest';
  render();

  document.getElementById('resultCard').innerHTML =
    '<p class="result-empty">Calculating optimal route…</p>';
  document.getElementById('directionsSection').style.display = 'none';
  setOverlay('🔍 Exploring city network…');

  // Run algorithm (synchronous, very fast for this graph)
  const result = dijkstra(srcId, dstId, window.currentMode);
  lastResult   = result;

  // ── Animate steps ──────────────────────────────────────────────
  const DELAY   = 160;  // ms per step
  const sleep   = ms => new Promise(r => setTimeout(r, ms));

  for (const step of result.steps) {
    if (step.type === 'init') {
      nodeState[step.nodeId] = 'source';
      render();
      await sleep(DELAY);

    } else if (step.type === 'relax') {
      if (nodeState[step.nodeId] !== 'source' && nodeState[step.nodeId] !== 'dest') {
        nodeState[step.nodeId] = 'exploring';
      }
      const ei = EDGE_MAP[`${step.fromId}-${step.nodeId}`];
      if (ei !== undefined && edgeState[ei] !== 'path') {
        edgeState[ei] = 'explore';
      }
      render();
      await sleep(DELAY * 0.9);

    } else if (step.type === 'settle') {
      const ns = nodeState[step.nodeId];
      if (ns !== 'source' && ns !== 'dest') {
        nodeState[step.nodeId] = 'settled';
      }
      render();
      await sleep(DELAY * 0.5);

    } else if (step.type === 'done') {
      break;
    }
  }

  // ── Show final path ────────────────────────────────────────────
  if (!result.found) {
    setOverlay('❌ No route exists between these two points.');
    document.getElementById('resultCard').innerHTML = `
      <p class="result-empty" style="color:#f87171;">
        No path found. The two locations may not be connected.
      </p>`;
    isRunning = false;
    document.getElementById('findBtn').disabled = false;
    return;
  }

  // Apply path visuals + start dash animation
  applyResult(result, srcId, dstId);

  const unit = window.currentMode === 'km' ? 'km' : 'min';
  setOverlay(`✅ Route found — ${result.totalCost.toFixed(1)} ${unit}`);

  // ── Populate summary card ──────────────────────────────────────
  const srcNode = NODES[srcId];
  const dstNode = NODES[dstId];
  const cost    = result.totalCost.toFixed(1);

  // Compute secondary stat
  let secondVal, secondLabel;
  if (window.currentMode === 'km') {
    // avg speed 35 km/h in city
    secondVal   = Math.round(result.totalCost / 35 * 60) + ' min';
    secondLabel = 'Est. Travel Time';
  } else {
    secondVal   = (result.totalCost * 35 / 60).toFixed(1) + ' km';
    secondLabel = 'Est. Distance';
  }

  const stops = result.path.length - 2;

  document.getElementById('resultCard').innerHTML = `
    <div class="result-route">${srcNode.abbr} ${srcNode.name} &rarr; ${dstNode.abbr} ${dstNode.name}</div>
    <div class="stat-grid">
      <div class="stat-box">
        <div class="stat-value">${cost} ${unit}</div>
        <div class="stat-label">${window.currentMode === 'km' ? 'Total Distance' : 'Travel Time'}</div>
      </div>
      <div class="stat-box">
        <div class="stat-value" style="color:#38bdf8">${secondVal}</div>
        <div class="stat-label">${secondLabel}</div>
      </div>
      <div class="stat-box">
        <div class="stat-value" style="color:#a78bfa">${result.path.length}</div>
        <div class="stat-label">Nodes on Route</div>
      </div>
      <div class="stat-box">
        <div class="stat-value" style="color:#fb923c">${Math.max(0, stops)}</div>
        <div class="stat-label">Intermediate Stops</div>
      </div>
    </div>
    <div class="result-mode-tag">
      Optimized by: <strong>${window.currentMode === 'km' ? 'Shortest Distance' : 'Fastest Route'}</strong>
    </div>`;

  // ── Algorithm stats ────────────────────────────────────────────
  document.getElementById('statNodes').textContent = `${result.nodesSettled} nodes settled`;
  document.getElementById('statEdges').textContent = `${result.edgesRelaxed} edge relaxations`;

  // ── Turn-by-turn directions ────────────────────────────────────
  buildDirections(result, srcId);

  isRunning = false;
  document.getElementById('findBtn').disabled = false;
}

function buildDirections(result, srcId) {
  const list = document.getElementById('dirList');
  list.innerHTML = '';

  result.path.forEach((nodeId, i) => {
    const n    = NODES[nodeId];
    const isFirst = i === 0;
    const isLast  = i === result.path.length - 1;

    let prefix = isFirst ? '🚀 Start at' : (isLast ? '🏁 Arrive at' : '↪ Head to');

    // Edge detail to next node
    let detail = '';
    if (!isLast) {
      const nextId = result.path[i + 1];
      const edge   = EDGES.find(e =>
        (e.from === nodeId && e.to === nextId) ||
        (e.from === nextId && e.to === nodeId)
      );
      if (edge) {
        const roadType = edge.express ? 'via expressway' : 'via main road';
        detail = `<div class="dir-sub">${edge.km} km · ${edge.min} min · ${roadType}</div>`;
      }
    }

    const li = document.createElement('li');
    li.className = 'dir-item';
    li.innerHTML = `
      <div class="dir-step">${i + 1}</div>
      <div class="dir-text">
        ${prefix} <strong>${n.name}</strong>
        ${detail}
      </div>`;
    list.appendChild(li);
  });

  document.getElementById('directionsSection').style.display = 'block';
}

// ── Reset ──────────────────────────────────────────────────────────
function resetAll() {
  isRunning  = false;
  lastResult = null;
  resetVisuals();
  hideResults();
  setOverlay('Click "Find Best Route" to start');
  updateFindBtn();

  // Re-mark selected source/dest (if any)
  const srcId = getSrc();
  const dstId = getDst();
  if (srcId !== null) nodeState[srcId] = 'source';
  if (dstId !== null) nodeState[dstId] = 'dest';
  render();

  document.getElementById('statNodes').textContent = '—';
  document.getElementById('statEdges').textContent = '—';
}

function hideResults() {
  document.getElementById('resultCard').innerHTML =
    '<p class="result-empty">Select two locations and click "Find Best Route".</p>';
  document.getElementById('directionsSection').style.display = 'none';
}

function setOverlay(msg) {
  document.getElementById('mapOverlay').textContent = msg;
}
