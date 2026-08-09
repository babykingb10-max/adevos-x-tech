import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const s = io(import.meta.env.VITE_SOCKET_URL, { transports: ["websocket", "polling"] });
    socketRef.current = s;
    setSocket(s);
    return () => s.disconnect();
  }, []);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

// Returns a number that increments every time the backend broadcasts a
// "content-changed" event matching `type` (or with type "all"). Include this
// value in a useEffect's dependency array to silently refetch when the Admin
// App changes that content — no manual page refresh needed.
//
//   const refreshTick = useContentRefresh("services");
//   useEffect(() => { api.get("/services").then(...) }, [refreshTick]);
export function useContentRefresh(type) {
  const socket = useContext(SocketContext);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!socket) return;
    function handler(payload) {
      if (payload?.type === type || payload?.type === "all") {
        setTick((t) => t + 1);
      }
    }
    socket.on("content-changed", handler);
    return () => socket.off("content-changed", handler);
  }, [socket, type]);

  return tick;
}
