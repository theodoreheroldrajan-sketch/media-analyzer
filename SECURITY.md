# Security Policy

## Reporting a vulnerability

Use GitHub's Private Vulnerability Reporting on this repo: **Security tab > Report a vulnerability**. Do not file public issues for security concerns.

The project maintainer will respond directly via the private channel.

## Known security considerations

### UUID-based project access

The tool uses UUID-based project access without authentication. Anyone with a project URL has full access to that project's data, including the ability to delete it. This is the intended design for single-operator self-host, not a bug.

If you self-host and share a project URL with someone, they have full destructive access. For solo use this is acceptable. If multiple people need to share an instance, fork the project and add Supabase Auth and Row Level Security. See [LIMITATIONS.md](LIMITATIONS.md) section 4 for the full disclosure.

### No authentication layer

The tool ships without user authentication. The deployment model is single-operator self-host: the person who deploys it is the only person who uses it. Multi-tenant deployments are out of scope for this codebase.

### PostCSS transitive advisory

`npm audit` flags a moderate-severity advisory on PostCSS reached transitively via Next.js's bundled CSS pipeline. PostCSS runs only at build time, not in the request runtime, and no user-controlled input flows into it. The advisory is not exploitable in this deployment. See [LIMITATIONS.md](LIMITATIONS.md) section 2 for details.

### Dependencies

Run `npm audit` after cloning to check for any new advisories. The project pins to Next.js 16.x; upstream PostCSS fixes will arrive with a future Next.js minor release.
