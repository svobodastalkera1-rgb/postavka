// Alwaysdata provides IP and PORT to Node.js sites; Nitro reads HOST and PORT.
// Keep newly created SQLite files and WAL sidecars private to this account.
process.umask(0o077);
process.env.HOST ||= process.env.IP || "127.0.0.1";
await import("./.output/server/index.mjs");

