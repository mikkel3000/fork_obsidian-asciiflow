const fullwidthRanges: Array<[number, number]> = [
  [0x1100, 0x115f],
  [0x2329, 0x232a],
  [0x2e80, 0x303e],
  [0x3040, 0xa4cf],
  [0xac00, 0xd7a3],
  [0xf900, 0xfaff],
  [0xfe10, 0xfe19],
  [0xfe30, 0xfe6f],
  [0xff00, 0xff60],
  [0xffe0, 0xffe6],
  [0x20000, 0x3fffd],
];

export function charWidth(ch: string): number {
  if (!ch) return 0;
  const code = ch.codePointAt(0) ?? 0;
  for (const [start, end] of fullwidthRanges) {
    if (code >= start && code <= end) return 2;
  }
  return 1;
}
