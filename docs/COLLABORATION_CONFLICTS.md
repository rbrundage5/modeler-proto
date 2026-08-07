# Collaboration Conflicts

An operation rebases only when its expected scope still matches. Independent fields, nodes, labels, endpoints, and IDs merge automatically. A stale same-scope edit becomes an explicit conflict; the client pauses it until the user accepts the room state or intentionally retries the local value. Forced resolution is attributable in revision metadata. Future milestones add durable conflict assignment and richer manual/text merge UI.
