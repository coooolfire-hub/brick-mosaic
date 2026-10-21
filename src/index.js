// brick-mosaic core: turn raster images into 2D brick mosaic plans.
// Zero dependencies. Works in Node and in the browser.
//
// Input pixels are raw RGBA bytes (e.g. Canvas ImageData.data), so this
// library stays decoupled from any image loader.

/** Weighted RGB distance (redmean approximation of perceptual distance). */
export function colorDistance(r1, g1, b1, r2, g2, b2) {
  const rm = (r1 + r2) / 2;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
}

/** Find the palette entry closest to an RGB color. */
export function nearestColor(r, g, b, palette) {
  let best = null;
  let bestDist = Infinity;
  for (const c of palette) {
    const d = colorDistance(r, g, b, c.rgb[0], c.rgb[1], c.rgb[2]);
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}

/** Count usage per color code in a 2D grid. Returns entries sorted by count, desc. */
export function countColors(grid) {
  const map = new Map();
  let total = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (!cell) continue;
      total++;
      if (!map.has(cell.code)) {
        map.set(cell.code, { code: cell.code, name: cell.name, rgb: cell.rgb, count: 0 });
      }
      map.get(cell.code).count++;
    }
  }
  return { stats: [...map.values()].sort((a, b) => b.count - a.count), total };
}

/**
 * Convert raw RGBA pixels to a brick mosaic plan.
 *
 * @param {Uint8ClampedArray|Uint8Array} pixels RGBA bytes, row-major.
 * @param {number} width  source image width in pixels
 * @param {number} height source image height in pixels
 * @param {object} options
 * @param {number} options.gridWidth   mosaic width in studs (default 64)
 * @param {Array}  options.palette     [{code, name, rgb:[r,g,b]}] (required)
 * @param {number} [options.plateSize] baseplate size in studs (default 32);
 *                   stored on the result for splitIntoPlates convenience
 * @param {number} [options.maxColors] cap distinct colors; least-used
 *                   colors are remapped to their nearest surviving color
 * @param {number} [options.alphaThreshold] pixels with alpha below this
 *                   count as empty (default 128)
 * @returns {{grid: Array, gridWidth: number, gridHeight: number,
 *            stats: Array, totalStuds: number, plateSize: number}}
 */
export function imageDataToMosaic(pixels, width, height, options) {
  const opts = options || {};
  const palette = opts.palette;
  if (!palette || palette.length === 0) throw new Error('options.palette is required');
  const gridWidth = opts.gridWidth || 64;
  const plateSize = opts.plateSize || 32;
  const alphaThreshold = opts.alphaThreshold === undefined ? 128 : opts.alphaThreshold;
  const gridHeight = Math.max(1, Math.round((gridWidth * height) / width));

  const grid = [];
  for (let gy = 0; gy < gridHeight; gy++) {
    const row = [];
    const y0 = Math.floor((gy * height) / gridHeight);
    const y1 = Math.max(y0 + 1, Math.floor(((gy + 1) * height) / gridHeight));
    for (let gx = 0; gx < gridWidth; gx++) {
      const x0 = Math.floor((gx * width) / gridWidth);
      const x1 = Math.max(x0 + 1, Math.floor(((gx + 1) * width) / gridWidth));
      let r = 0, g = 0, b = 0, n = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * width + x) * 4;
          if (pixels[i + 3] < alphaThreshold) continue;
          r += pixels[i];
          g += pixels[i + 1];
          b += pixels[i + 2];
          n++;
        }
      }
      row.push(n === 0 ? null : nearestColor(r / n, g / n, b / n, palette));
    }
    grid.push(row);
  }

  if (opts.maxColors && opts.maxColors > 0) {
    const { stats } = countColors(grid);
    if (stats.length > opts.maxColors) {
      const keep = new Set(stats.slice(0, opts.maxColors).map((s) => s.code));
      const keepPalette = palette.filter((c) => keep.has(c.code));
      for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
          const cell = grid[y][x];
          if (cell && !keep.has(cell.code)) {
            grid[y][x] = nearestColor(cell.rgb[0], cell.rgb[1], cell.rgb[2], keepPalette);
          }
        }
      }
    }
  }

  const { stats, total } = countColors(grid);
  return { grid, gridWidth, gridHeight, stats, totalStuds: total, plateSize };
}

/**
 * Split a mosaic into baseplates of plateSize x plateSize studs.
 * Plates on the right and bottom edges may be partial. The number of
 * plates is ceil(gridWidth / plateSize) * ceil(gridHeight / plateSize).
 *
 * @param {object} mosaic   result of imageDataToMosaic
 * @param {number} [plateSize] studs per plate side; defaults to
 *                   mosaic.plateSize, then 32
 * @returns {Array<{plateX: number, plateY: number, width: number,
 *           height: number, studs: number, stats: Array}>}
 *           stats is the per-plate color usage, same shape as countColors.
 */
export function splitIntoPlates(mosaic, plateSize) {
  const size = plateSize || mosaic.plateSize || 32;
  const platesX = Math.ceil(mosaic.gridWidth / size);
  const platesY = Math.ceil(mosaic.gridHeight / size);
  const plates = [];
  for (let py = 0; py < platesY; py++) {
    for (let px = 0; px < platesX; px++) {
      const w = Math.min(size, mosaic.gridWidth - px * size);
      const h = Math.min(size, mosaic.gridHeight - py * size);
      const sub = [];
      for (let y = 0; y < h; y++) {
        sub.push(mosaic.grid[py * size + y].slice(px * size, px * size + w));
      }
      const { stats, total } = countColors(sub);
      plates.push({ plateX: px, plateY: py, width: w, height: h, studs: total, stats });
    }
  }
  return plates;
}

function csvField(v) {
  const s = String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/**
 * Total parts list as a CSV string: one "code,name,count" line per used
 * color, sorted by count desc, with a header row. Counts are in studs
 * (one 1x1 plate or tile per stud).
 */
export function partsListToCSV(mosaic) {
  const lines = ['code,name,count'];
  for (const s of mosaic.stats) {
    lines.push([csvField(s.code), csvField(s.name), s.count].join(','));
  }
  return lines.join('\n') + '\n';
}

/**
 * Per-plate parts list as a CSV string with plate coordinates:
 * "plateX,plateY,code,name,count" — one line per color used on each
 * plate, so builders can sort and pack parts plate by plate.
 *
 * @param {Array} plates result of splitIntoPlates
 */
export function platesToCSV(plates) {
  const lines = ['plateX,plateY,code,name,count'];
  for (const p of plates) {
    for (const s of p.stats) {
      lines.push([p.plateX, p.plateY, csvField(s.code), csvField(s.name), s.count].join(','));
    }
  }
  return lines.join('\n') + '\n';
}

/** Render the mosaic as an SVG string: one rect per stud, with a subtle stud circle on top. */
export function mosaicToSVG(mosaic, svgOptions) {
  const o = svgOptions || {};
  const cell = o.cellSize || 20;
  const w = mosaic.gridWidth * cell;
  const h = mosaic.gridHeight * cell;
  const parts = [];
  parts.push('<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">');
  for (let y = 0; y < mosaic.gridHeight; y++) {
    for (let x = 0; x < mosaic.gridWidth; x++) {
      const c = mosaic.grid[y][x];
      if (!c) continue;
      const fill = 'rgb(' + c.rgb[0] + ',' + c.rgb[1] + ',' + c.rgb[2] + ')';
      parts.push('<rect x="' + x * cell + '" y="' + y * cell + '" width="' + cell + '" height="' + cell + '" fill="' + fill + '" stroke="rgba(0,0,0,0.2)"/>');
      parts.push('<circle cx="' + (x * cell + cell / 2) + '" cy="' + (y * cell + cell / 2) + '" r="' + (cell * 0.3) + '" fill="#ffffff" opacity="0.18"/>');
    }
  }
  parts.push('</svg>');
  return parts.join('');
}

/** Render the mosaic as a plain-text grid of color codes (.. = empty). */
export function mosaicToText(mosaic) {
  return mosaic.grid
    .map((row) => row.map((c) => (c ? c.code : '..')).join(' '))
    .join('\n');
}
