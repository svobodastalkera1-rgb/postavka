// Alwaysdata provides IP and PORT to Node.js sites; Nitro reads HOST and PORT.
process.env.HOST ||= process.env.IP || "127.0.0.1";
await import("./.output/server/index.mjs");
