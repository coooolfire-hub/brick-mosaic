// Generic 24-color brick palette (house codes B01-B24).
// This is a generic palette for mosaic planning. It is not affiliated
// with or endorsed by the LEGO Group, and the colors are representative
// screen values approximating common brick colors — not official color
// data. To use a specific manufacturer's colors, supply your own palette
// in the same shape: [{ code, name, rgb: [r, g, b] }] — see README
// "Bring your own palette".

function hex(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}

const RAW = [
  ['B01', 'White', '#F4F4F4'],
  ['B02', 'Light Bluish Grey', '#A3A2A4'],
  ['B03', 'Dark Bluish Grey', '#6B6E68'],
  ['B04', 'Black', '#1B1F23'],
  ['B05', 'Red', '#C91A09'],
  ['B06', 'Dark Red', '#720E0F'],
  ['B07', 'Orange', '#FE8A18'],
  ['B08', 'Bright Yellow', '#F2CD37'],
  ['B09', 'Tan', '#E4CD9E'],
  ['B10', 'Dark Tan', '#958A73'],
  ['B11', 'Reddish Brown', '#5F3109'],
  ['B12', 'Dark Brown', '#352100'],
  ['B13', 'Bright Green', '#4B974B'],
  ['B14', 'Dark Green', '#184632'],
  ['B15', 'Lime', '#A5CA18'],
  ['B16', 'Bright Blue', '#0055BF'],
  ['B17', 'Dark Blue', '#0A3463'],
  ['B18', 'Medium Azure', '#36AEBF'],
  ['B19', 'Bright Light Blue', '#B4D2E3'],
  ['B20', 'Bright Pink', '#FC97AC'],
  ['B21', 'Magenta', '#923978'],
  ['B22', 'Bright Purple', '#81007B'],
  ['B23', 'Sand Green', '#A0BCAC'],
  ['B24', 'Nougat', '#D67923'],
];

export const brick24 = RAW.map(([code, name, h]) => ({ code, name, rgb: hex(h) }));
export default brick24;
