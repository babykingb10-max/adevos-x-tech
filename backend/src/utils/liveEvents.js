// Small helper so any route can push a one-line event into the Admin App's
// "Live activity" feed without importing socket.io directly everywhere.
function emitLiveEvent(app, message) {
  try {
    const io = app.get("io");
    if (!io) return;
    const line = `[${new Date().toLocaleTimeString()}] ${message}`;
    io.to("admin-live").emit("live-event", line);
  } catch (err) {
    console.error("[liveEvents] failed to emit:", err.message);
  }
}

// Tells every connected client (the public site) that a given content type
// changed in the database, so components can silently refetch instead of the
// user needing to manually refresh the page. `type` matches the keys used by
// the frontend's useContentRefresh(type) hook — e.g. "services", "bots".
function broadcastContentChange(app, type) {
  try {
    const io = app.get("io");
    if (!io) return;
    io.emit("content-changed", { type });
  } catch (err) {
    console.error("[liveEvents] failed to broadcast:", err.message);
  }
}

module.exports = { emitLiveEvent, broadcastContentChange };
