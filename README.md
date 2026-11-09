# Planning Poker

A real-time planning poker app built with Express and Socket.IO.

## Features

- Fibonacci estimation deck with shared voting, reveal, and new-round controls
- Cookie-based participant sessions and live presence with a 30-second reconnect grace period
- Shared background themes, emoji reactions, and local reaction sounds
- Any connected participant can use game controls

## Run locally

Requires Node.js 18 or newer.

```sh
npm install
node server.js
```

Open [http://localhost:3000](http://localhost:3000). Set `PORT` to use a different port.

## Data and restarts

The app writes its LowDB file to `db.json` in the project root by default. Set `DATA_DIR` to use another directory. Game state and sessions are intentionally cleared whenever the server starts, so participants must rejoin after a restart. Render Free services also have ephemeral filesystems.
