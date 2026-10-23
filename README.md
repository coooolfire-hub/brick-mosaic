# brick-mosaic

[![npm version](https://img.shields.io/npm/v/brick-mosaic.svg)](https://www.npmjs.com/package/brick-mosaic) [![npm downloads](https://img.shields.io/npm/dm/brick-mosaic.svg)](https://www.npmjs.com/package/brick-mosaic)

Turn any image into a **2D brick mosaic plan**: a palette-mapped stud
grid, automatic splitting into baseplates, per-plate and total parts
lists, and CSV export. Zero dependencies, runs in Node and in the
browser.

把任意图片转成**积木马赛克拼搭方案**：按色卡映射的颗粒网格、自动切分底板、
每块底板和总计的零件清单，可导出 CSV。零依赖，Node 和浏览器都能跑。

![license](https://img.shields.io/badge/license-MIT-green)

## Why

Most image-to-mosaic tools stop at a pixelated picture. Actually
building the thing needs a plan:

- colors must snap to a **real, buyable palette**, not arbitrary RGB
- the mosaic must be **split into baseplates** (32x32, 48x48...) —
  nobody builds one giant plate at a time
- you need a **parts list per plate and in total**, in a format you can
  paste into a spreadsheet or a parts order
- transparent / empty areas must stay empty

brick-mosaic does exactly that, as a small library you can build on.

## Install

```bash
npm install brick-mosaic
```

Or clone this repo and import `src/index.js` directly — there are no
dependencies to install.

## Usage

```js
import {
  imageDataToMosaic,
  splitIntoPlates,
  partsListToCSV,
  platesToCSV,
  mosaicToSVG,
} from 'brick-mosaic';
import { brick24 } from 'brick-mosaic/palettes/brick-24';

// pixels: raw RGBA bytes, e.g. Canvas ImageData.data in the browser,
// or decoded image data in Node (bring your own decoder).
const mosaic = imageDataToMosaic(pixels, width, height, {
  gridWidth: 64,    // mosaic width in studs
  palette: brick24, // [{ code, name, rgb: [r, g, b] }]
  plateSize: 32,    // baseplate size in studs
  maxColors: 16,    // cap distinct colors (optional)
});

console.log(mosaic.totalStuds); // total 1x1 parts needed
console.log(mosaic.stats);      // [{ code, name, rgb, count }] sorted desc

const plates = splitIntoPlates(mosaic); // uses mosaic.plateSize
console.log(plates.length);             // number of baseplates
console.log(plates[0].stats);           // parts list for the first plate

console.log(partsListToCSV(mosaic)); // "code,name,count" for the whole build
console.log(platesToCSV(plates));    // "plateX,plateY,code,name,count"
const svg = mosaicToSVG(mosaic);     // visual preview with stud highlights
```

## Demo

Open `examples/demo.html` through any static server, e.g.:

```bash
npx serve .
# then visit http://localhost:3000/examples/demo.html
```

Pick an image, set grid width, plate size and max colors, and you get
the mosaic preview, the totals, the plate count, and a per-plate
breakdown table.

## Bring your own palette

A palette is just an array of `{ code, name, rgb }`. The bundled
`palettes/brick-24.js` is a generic 24-color set with representative RGB
values approximating common brick colors — handy for planning, but not
official data for any manufacturer. If you build with a specific brick
system, convert its color chart to the same shape and pass it in; the
mapping, splitting, stats and exports all work unchanged.
Community-contributed palettes are welcome, see CONTRIBUTING.md.

## API

- `imageDataToMosaic(pixels, width, height, options)` — main entry.
  Options: `gridWidth`, `palette` (required), `plateSize`,
  `maxColors`, `alphaThreshold`. Returns `{ grid, gridWidth,
  gridHeight, stats, totalStuds, plateSize }`; grid cells are palette
  objects or `null` for empty.
- `splitIntoPlates(mosaic, plateSize?)` — split into
  `plateSize x plateSize` plates (edge plates may be partial). Returns
  `[{ plateX, plateY, width, height, studs, stats }]`. Plate count is
  `ceil(gridWidth / plateSize) * ceil(gridHeight / plateSize)`, and the
  per-plate stud counts always sum to `mosaic.totalStuds`.
- `partsListToCSV(mosaic)` — total parts list as CSV:
  `code,name,count`.
- `platesToCSV(plates)` — per-plate parts list as CSV:
  `plateX,plateY,code,name,count`, so builders can sort and pack parts
  plate by plate.
- `nearestColor(r, g, b, palette)` — closest palette entry (redmean
  weighted RGB distance).
- `countColors(grid)` — `{ stats, total }` for any 2D grid of palette
  objects / nulls.
- `mosaicToSVG(mosaic, { cellSize })` — SVG preview string: one rect
  per stud with a subtle stud circle on top.
- `mosaicToText(mosaic)` — plain-text grid of codes.

## Roadmap

- [ ] Full 3D voxel building plans — see the related BrickForm tool below
- [ ] Round 1x1 tile option (flat mosaic style) alongside studded plates
- [ ] Cost estimate per parts list (price-per-part table input)
- [ ] Larger plate presets (48x48) and mixed plate layouts
- [ ] Printable per-plate PDF charts
- [ ] CLI wrapper

## Related

brick-mosaic is the open-source core extracted from
[格作 Gezuo](https://beads.coooolfire.tech), a free web tool that turns
images into patterns for fuse beads, bricks, crochet and cross-stitch
with production previews and material lists. For full 3D brick models
with structural checks, see its companion tool
[BrickForm](https://brickform.coooolfire.tech).

## Disclaimer

LEGO is a trademark of the LEGO Group, which does not sponsor or
endorse this project. This library ships a generic palette and planning
math only; it contains no manufacturer data.

## License

MIT
