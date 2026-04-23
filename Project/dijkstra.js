/**
 * dijkstra.js
 * Implements Dijkstra's Shortest Path Algorithm on the city graph.
 *
 * The algorithm uses a simple linear scan for the priority queue (O(V²)),
 * which is easy to understand and adequate for a city-sized graph.
 * A min-heap version (O((V+E) log V)) is noted in comments for reference.
 */

'use strict';

/**
 * Build an adjacency list from EDGES.
 * Since city roads are two-way, each edge is added in both directions.
 *
 * @param {string} metric  - 'km' (distance) or 'min' (travel time)
 * @returns {Object}  adj[nodeId] = [{ id, weight, edgeRef }]
 */
function buildAdjList(metric) {
  const adj = {};
  NODES.forEach(n => (adj[n.id] = []));

  EDGES.forEach(e => {
    const w = e[metric];
    adj[e.from].push({ id: e.to,   weight: w, edge: e });
    adj[e.to  ].push({ id: e.from, weight: w, edge: e });
  });

  return adj;
}

/**
 * Run Dijkstra's algorithm from srcId to dstId.
 *
 * Returns an object with:
 *   found       {boolean}  - whether a path exists
 *   path        {number[]} - ordered list of node IDs (src → ... → dst)
 *   totalCost   {number}   - total distance/time along the path
 *   dist        {Object}   - shortest distances from src to every node
 *   steps       {Object[]} - animation steps for the visualiser
 *   nodesSettled {number}  - how many nodes were fully processed
 *   edgesRelaxed {number}  - total edge relaxations performed
 *
 * @param {number} srcId
 * @param {number} dstId
 * @param {string} metric - 'km' | 'min'
 */
function dijkstra(srcId, dstId, metric) {
  const adj = buildAdjList(metric);

  // dist[id] = best known cost from src to id
  const dist    = {};
  // prev[id] = predecessor node id on best known path
  const prev    = {};
  // Whether a node has been fully settled (popped from PQ with final distance)
  const settled = new Set();

  NODES.forEach(n => {
    dist[n.id] = Infinity;
    prev[n.id] = null;
  });
  dist[srcId] = 0;

  // Steps are recorded for the animation engine in map.js
  const steps = [];
  let   edgesRelaxed = 0;

  steps.push({ type: 'init', nodeId: srcId });

  // ── Main loop ──────────────────────────────────────────────────
  // O(V²) with linear scan — perfectly fine for |V| = 15.
  // (A min-heap / priority queue would give O((V+E) log V) for large graphs.)
  while (true) {
    // 1. Pick the unvisited node with the smallest known distance
    let u = null;
    NODES.forEach(n => {
      if (!settled.has(n.id) && dist[n.id] !== Infinity) {
        if (!u || dist[n.id] < dist[u.id]) u = n;
      }
    });

    // No reachable node left, or we've reached the destination
    if (!u || u.id === dstId) break;

    settled.add(u.id);
    steps.push({ type: 'settle', nodeId: u.id });

    // 2. Relax all outgoing edges from u
    for (const nb of adj[u.id]) {
      if (settled.has(nb.id)) continue;

      const candidate = dist[u.id] + nb.weight;
      edgesRelaxed++;

      if (candidate < dist[nb.id]) {
        dist[nb.id] = candidate;
        prev[nb.id] = u.id;
        steps.push({ type: 'relax', nodeId: nb.id, fromId: u.id, edge: nb.edge });
      }
    }
  }

  // If destination was reached, settle it too
  if (!settled.has(dstId) && dist[dstId] !== Infinity) {
    settled.add(dstId);
    steps.push({ type: 'settle', nodeId: dstId });
  }

  // ── Reconstruct path ──────────────────────────────────────────
  const path = [];
  let   cur  = dstId;
  while (cur !== null) {
    path.unshift(cur);
    cur = prev[cur];
  }

  const found = (path[0] === srcId);

  steps.push({ type: 'done', found, path });

  return {
    found,
    path:         found ? path : [],
    totalCost:    found ? dist[dstId] : Infinity,
    dist,
    steps,
    nodesSettled: settled.size,
    edgesRelaxed,
  };
}
