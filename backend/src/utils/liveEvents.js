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

module.exports = { emitLiveEvent };
