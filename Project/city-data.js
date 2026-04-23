/**
 * city-data.js
 * City graph: nodes (locations) and edges (roads) with real-world attributes.
 * Nodes are positioned using normalized coordinates (0..1) relative to canvas size.
 */

'use strict';

// ── Type meta (color + dark background) ───────────────────────────────
const TYPE_META = {
  transit:     { color: '#3b82f6', bg: '#172554', label: 'Transit Hub' },
  medical:     { color: '#ef4444', bg: '#450a0a', label: 'Medical' },
  education:   { color: '#8b5cf6', bg: '#2e1065', label: 'Education' },
  commercial:  { color: '#f59e0b', bg: '#431407', label: 'Commercial' },
  recreation:  { color: '#10b981', bg: '#052e16', label: 'Recreation' },
  business:    { color: '#f97316', bg: '#431407', label: 'Business' },
  hotel:       { color: '#ec4899', bg: '#500724', label: 'Hospitality' },
  port:        { color: '#14b8a6', bg: '#042f2e', label: 'Harbor/Port' },
  residential: { color: '#60a5fa', bg: '#0c2246', label: 'Residential' },
  govt:        { color: '#0ea5e9', bg: '#0c1a4a', label: 'Government' },
};

/**
 * Each node represents a city location.
 * nx, ny = normalized position (0..1). Mapped to canvas pixel at render time.
 *
 * Layout (5 cols × 3 rows):
 *   Col:  0.09   0.28   0.48   0.67   0.87
 *   Row:  0.17   0.50   0.83
 */
const NODES = [
  // ─── Row 1 (North) ───────────────────────────────────────────
  { id: 0,  nx: 0.09, ny: 0.17, name: 'International Airport', short: 'Airport',       type: 'transit',    abbr: '✈' },
  { id: 1,  nx: 0.28, ny: 0.17, name: 'City Museum',           short: 'Museum',        type: 'recreation', abbr: 'M' },
  { id: 2,  nx: 0.48, ny: 0.17, name: 'City Hall',             short: 'City Hall',     type: 'govt',       abbr: 'CH' },
  { id: 3,  nx: 0.67, ny: 0.17, name: 'State University',      short: 'University',    type: 'education',  abbr: 'U' },
  { id: 4,  nx: 0.87, ny: 0.17, name: 'General Hospital',      short: 'Hospital',      type: 'medical',    abbr: '+' },
  // ─── Row 2 (Centre) ──────────────────────────────────────────
  { id: 5,  nx: 0.09, ny: 0.50, name: 'Central Bus Terminal',  short: 'Bus Terminal',  type: 'transit',    abbr: '🚌' },
  { id: 6,  nx: 0.28, ny: 0.50, name: 'Central Railway Stn.',  short: 'Railway Stn.',  type: 'transit',    abbr: '🚉' },
  { id: 7,  nx: 0.48, ny: 0.50, name: 'Public Library',        short: 'Library',       type: 'education',  abbr: 'L' },
  { id: 8,  nx: 0.67, ny: 0.50, name: 'Hotel District',        short: 'Hotels',        type: 'hotel',      abbr: 'H' },
  { id: 9,  nx: 0.87, ny: 0.50, name: 'Shopping Mall',         short: 'Mall',          type: 'commercial', abbr: '🛍' },
  // ─── Row 3 (South) ───────────────────────────────────────────
  { id: 10, nx: 0.09, ny: 0.83, name: 'Harbor & Port',         short: 'Harbor',        type: 'port',       abbr: '⚓' },
  { id: 11, nx: 0.28, ny: 0.83, name: 'Sports Stadium',        short: 'Stadium',       type: 'recreation', abbr: 'S' },
  { id: 12, nx: 0.48, ny: 0.83, name: 'Market Square',         short: 'Market',        type: 'commercial', abbr: '🏪' },
  { id: 13, nx: 0.67, ny: 0.83, name: 'Residential District',  short: 'Residential',   type: 'residential',abbr: '🏘' },
  { id: 14, nx: 0.87, ny: 0.83, name: 'Tech Park',             short: 'Tech Park',     type: 'business',   abbr: '💻' },
];

/**
 * Each edge = a road segment between two locations.
 * km    = distance in kilometres
 * min   = travel time in minutes (accounts for speed limits, traffic lights)
 * express = true for highways / express roads (drawn differently on map)
 */
const EDGES = [
  // ── Row 1 horizontal (North Ring Road) ──────────────────────
  { from: 0,  to: 1,  km: 4.5,  min: 10 },
  { from: 1,  to: 2,  km: 4.7,  min: 11 },
  { from: 2,  to: 3,  km: 4.5,  min: 10 },
  { from: 3,  to: 4,  km: 3.9,  min: 9  },
  // ── Row 2 horizontal (Central Avenue) ───────────────────────
  { from: 5,  to: 6,  km: 4.6,  min: 13 },
  { from: 6,  to: 7,  km: 4.8,  min: 11 },
  { from: 7,  to: 8,  km: 4.4,  min: 10 },
  { from: 8,  to: 9,  km: 4.6,  min: 12 },
  // ── Row 3 horizontal (South Bypass) ─────────────────────────
  { from: 10, to: 11, km: 4.3,  min: 12 },
  { from: 11, to: 12, km: 4.4,  min: 11 },
  { from: 12, to: 13, km: 4.5,  min: 10 },
  { from: 13, to: 14, km: 4.5,  min: 11 },
  // ── Column 1 vertical (West Street) ─────────────────────────
  { from: 0,  to: 5,  km: 4.8,  min: 14 },
  { from: 5,  to: 10, km: 4.6,  min: 13 },
  // ── Column 2 vertical (Museum Road) ─────────────────────────
  { from: 1,  to: 6,  km: 4.8,  min: 13 },
  { from: 6,  to: 11, km: 4.7,  min: 12 },
  // ── Column 3 vertical (City Center Road) ────────────────────
  { from: 2,  to: 7,  km: 4.7,  min: 12 },
  { from: 7,  to: 12, km: 4.9,  min: 13 },
  // ── Column 4 vertical (University Boulevard) ─────────────────
  { from: 3,  to: 8,  km: 5.0,  min: 11 },
  { from: 8,  to: 13, km: 4.9,  min: 12 },
  // ── Column 5 vertical (East Avenue) ─────────────────────────
  { from: 4,  to: 9,  km: 4.8,  min: 12 },
  { from: 9,  to: 14, km: 4.9,  min: 13 },
  // ── Express / Diagonal Roads ─────────────────────────────────
  { from: 0,  to: 6,  km: 6.8,  min: 11, express: true },  // Airport Express Link
  { from: 2,  to: 6,  km: 5.2,  min: 9,  express: true },  // City Hall ↔ Station Flyover
  { from: 4,  to: 14, km: 7.0,  min: 10, express: true },  // Hospital ↔ Tech Park Highway
  { from: 1,  to: 7,  km: 5.5,  min: 12 },                 // Museum ↔ Library shortcut
  { from: 3,  to: 9,  km: 5.6,  min: 13 },                 // University ↔ Mall diagonal
  { from: 6,  to: 12, km: 5.5,  min: 14 },                 // Station ↔ Market diagonal
  { from: 7,  to: 13, km: 5.6,  min: 13 },                 // Library ↔ Residential cut
  { from: 8,  to: 14, km: 5.5,  min: 12 },                 // Hotels ↔ Tech Park cut
];
