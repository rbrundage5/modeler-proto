# Collaboration Security

Mutation validation and role checks run in the Durable Object. Messages have a 2 MB limit, operation type/schema validation, branch isolation, and server-derived actor identity. Production deployments must use Cloudflare Access or a trusted `X-Modeler-User` adapter; guest session IDs are development identity, not authentication. Future security work includes invitation tokens, detailed permission policies, rate limits, retention, and abuse controls.
