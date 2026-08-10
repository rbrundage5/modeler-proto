# D-01 manual desktop acceptance checklist

Record OS, Node/npm versions, commit, endpoint, fixture hashes, and evidence. Never use production collaboration services.

- [ ] Run `npm run desktop:dev`; confirm the real application opens.
- [ ] Create a project and edit a semantic element.
- [ ] Create/open a diagram; place and move a presentation.
- [ ] Save, close, reopen, and compare semantic IDs, presentation IDs, and geometry.
- [ ] Import a representative legacy project.
- [ ] Import a representative XLSX; reimport and confirm stable identity.
- [ ] Inspect complete Requirement text, qualified names, configurations, and baselines.
- [ ] Exercise application undo/redo and OS clipboard cut/copy/paste.
- [ ] Save As and verify the original is unchanged.
- [ ] Modify, then test Open/New/Exit unsaved-change protection.
- [ ] Use an authorized non-production room; verify project/branch identity, replay, presence isolation, and offline queues.
- [ ] Run `npm run dev` and repeat a browser create/edit/import/export smoke test.

All GUI items are unexecuted in the headless Linux environment until recorded otherwise.
