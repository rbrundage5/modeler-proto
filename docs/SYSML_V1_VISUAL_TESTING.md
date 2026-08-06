# SysML v1 visual testing

## Deterministic fixtures

`createNotationGallery()` generates a stable layout family for every supported diagram type. Semantic fixture models are separate from browser screenshots. Unit tests verify registry coverage, marker ownership, stereotype labels, migration, and gallery coverage.

## Manual browser procedure

1. Run `npm ci`, then `npm run dev` with Node.js 22.
2. Choose **Help → Open SysML Notation Gallery**.
3. Set a 1600×1000 viewport, 100% browser zoom, 100% diagram zoom, and the platform’s standard sans-serif font.
4. Review all diagram tabs in color, grayscale print preview, and high-contrast mode.
5. Export SVG and confirm frames, clipping, labels, line styles, and markers.
6. Save/reopen the project and repeat checks for IBD port attachment and association-end marker ownership.

## Baseline updates

Screenshot baselines must be updated intentionally in browser CI, reviewed diagram by diagram, and committed separately from renderer changes. Normal test execution must never replace a baseline. A failure should name the gallery diagram and mismatch bounds. Anti-aliasing tolerance must remain small and fonts/viewport must be pinned.
