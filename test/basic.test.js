import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  imageDataToMosaic,
  splitIntoPlates,
  partsListToCSV,
  platesToCSV,
} from '../src/index.js';
import { brick24 } from '../palettes/brick-24.js';

test('half white / half red image maps to two palette colors', () => {
  const w = 8;
  const h = 4;
  const px = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const red = x >= 4;
      // exact palette RGB values: White #F4F4F4, Red #C91A09
      px[i] = red ? 201 : 244;
      px[i + 1] = red ? 26 : 244;
      px[i + 2] = red ? 9 : 244;
      px[i + 3] = 255;
    }
  }
  const m = imageDataToMosaic(px, w, h, { gridWidth: 8, palette: brick24 });
  assert.equal(m.gridWidth, 8);
  assert.equal(m.gridHeight, 4);
  assert.equal(m.totalStuds, 32);
  assert.equal(m.stats.length, 2);
  assert.equal(m.stats[0].count, 16);
  assert.equal(m.stats[1].count, 16);
});

test('splitIntoPlates splits a 70x40 mosaic into 3x2 plates at size 32', () => {
  // Build a mosaic object directly: a full 70x40 grid of one color.
  const cell = brick24[0]; // White
  const grid = [];
  for (let y = 0; y < 40; y++) grid.push(new Array(70).fill(cell));
  const mosaic = {
    grid,
    gridWidth: 70,
    gridHeight: 40,
    stats: [{ code: cell.code, name: cell.name, rgb: cell.rgb, count: 70 * 40 }],
    totalStuds: 70 * 40,
    plateSize: 32,
  };
  const plates = splitIntoPlates(mosaic, 32);
  assert.equal(plates.length, 6); // ceil(70/32)=3, ceil(40/32)=2
  const sum = plates.reduce((acc, p) => acc + p.studs, 0);
  assert.equal(sum, mosaic.totalStuds);
  // Edge plates are partial: last column is 70 - 64 = 6 wide, last row 40 - 32 = 8 high.
  const corner = plates.find((p) => p.plateX === 2 && p.plateY === 1);
  assert.equal(corner.width, 6);
  assert.equal(corner.height, 8);
  assert.equal(corner.studs, 48);
  const full = plates.find((p) => p.plateX === 0 && p.plateY === 0);
  assert.equal(full.width, 32);
  assert.equal(full.height, 32);
  assert.equal(full.studs, 1024);
});

test('CSV export has header and one line per used color with correct counts', () => {
  const w = 8;
  const h = 4;
  const px = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const red = x >= 4;
      px[i] = red ? 201 : 244;
      px[i + 1] = red ? 26 : 244;
      px[i + 2] = red ? 9 : 244;
      px[i + 3] = 255;
    }
  }
  const m = imageDataToMosaic(px, w, h, { gridWidth: 8, palette: brick24 });
  const csv = partsListToCSV(m);
  const lines = csv.trim().split('\n');
  assert.equal(lines[0], 'code,name,count');
  assert.equal(lines.length, 1 + 2); // header + 2 used colors
  const byCode = {};
  for (const line of lines.slice(1)) {
    const parts = line.split(',');
    byCode[parts[0]] = parseInt(parts[parts.length - 1], 10);
  }
  assert.equal(byCode.B01, 16); // White
  assert.equal(byCode.B05, 16); // Red

  // Per-plate CSV carries plate coordinates.
  const plates = splitIntoPlates(m, 4);
  const pLines = platesToCSV(plates).trim().split('\n');
  assert.equal(pLines[0], 'plateX,plateY,code,name,count');
  assert.ok(pLines.length > 1);
  const plateSum = pLines.slice(1).reduce((acc, line) => {
    const parts = line.split(',');
    return acc + parseInt(parts[parts.length - 1], 10);
  }, 0);
  assert.equal(plateSum, m.totalStuds);
});

test('transparent pixels become empty cells', () => {
  const w = 2;
  const h = 2;
  const px = new Uint8ClampedArray(w * h * 4); // all alpha 0
  const m = imageDataToMosaic(px, w, h, { gridWidth: 2, palette: brick24 });
  assert.equal(m.totalStuds, 0);
  assert.equal(m.grid[0][0], null);
  assert.equal(m.grid[1][1], null);
  assert.equal(m.stats.length, 0);
});

test('maxColors caps the number of distinct colors', () => {
  const w = 16;
  const h = 2;
  const px = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    px[i * 4] = (i * 37) % 256;
    px[i * 4 + 1] = (i * 91) % 256;
    px[i * 4 + 2] = (i * 53) % 256;
    px[i * 4 + 3] = 255;
  }
  const m = imageDataToMosaic(px, w, h, { gridWidth: 16, palette: brick24, maxColors: 4 });
  assert.ok(m.stats.length <= 4);
});
