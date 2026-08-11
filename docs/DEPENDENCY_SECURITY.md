# Dependency Security Exceptions

Janani's production dependency audit rejects every unmitigated high or critical advisory. One narrow, source-controlled exception is currently required for Metro's transitive `image-size` dependency.

## `image-size` parser denial of service

Metro 0.83 requires the legacy path-or-buffer CommonJS API from `image-size`, while the current official `image-size@2.0.2` release reports these no-fix advisories:

- `GHSA-w3rx-r6r6-pgpr` for the ICNS parser; and
- `GHSA-5p2g-fcmc-qvqq` for the HEIF and JXL parsers.

Janani resolves Metro's import through `vendor/image-size-compat`. The adapter uses the integrity-pinned official package, disables every parser outside Metro's supported image list before the first parse, does not expose the upstream parser-control function, and accepts file paths by converting them to buffers. Its regression test verifies PNG/JPEG path and buffer compatibility and rejects empty, ICNS, HEIF/AVIF, JXL, and JXL-stream-shaped inputs without invoking those parsers.

`scripts/audit-production.mjs` allows only the two advisory URLs above, only for the exact locked `image-size-upstream@2.0.2` node, and only after the adapter regression test passes. Any other high or critical finding fails CI.

Remove the adapter and exception when Metro and Expo support an official non-vulnerable `image-size` release with the required API. Re-review this decision before adding an image type outside PNG, JPEG, BMP, GIF, WebP, PSD, SVG, TIFF, or KTX.
