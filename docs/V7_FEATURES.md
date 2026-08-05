# Version 7 production-candidate improvements

- Blank projects remain blank; packages only come from user creation, templates, or import.
- Multiple independent browser projects with create, save, reopen, duplicate, archive, restore, and delete.
- Backspace/Delete removes the current diagram presentation, relationship, or semantic element.
- Escape cancels the palette/relationship tool and returns to Select mode.
- Ctrl/Cmd + mouse wheel zooms around the pointer.
- Middle mouse or Space + drag pans the diagram.
- Double-clicking a compatible element opens or creates its child diagram.
- Relationship lines are clipped to symbol boundaries and arrowheads/diamonds are rendered above symbols.
- Multi-pass workbook import resolves elements, owners, types, relationships, diagrams, presentations, and child links.
- Collaboration queues unsent operations, reconnects with exponential backoff, sends heartbeats, and suppresses duplicate operations.

This remains an independently implemented SysML environment. CATIA/Cameo proprietary interchange must be tested against licensed target installations.
