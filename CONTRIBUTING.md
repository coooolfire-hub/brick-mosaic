# Contributing

Thanks for helping. The most wanted contributions:

1. **Brick palettes** — color sets for specific brick systems as
   `{ code, name, rgb }` arrays under `palettes/`. Please note the
   source of the color data in the file header, and use your own codes.
2. **Bug reports** — include a small test image (or its pixel dimensions),
   the options you used, and the plate size when splitting is involved.
3. **Features** — keep the zero-dependency rule for `src/`. Dev-only
   tooling is fine.

Run tests before sending a PR:

```bash
npm test
```

Keep functions pure and exported individually so they stay testable.
