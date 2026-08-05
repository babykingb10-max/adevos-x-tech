import { createContext, useContext, useState } from "react";

const PopupContext = createContext(null);

// Any destination string starting with "popup:" (from Menu items, Footer links,
// Hero slides, In-Touch cards) is routed through here. `payload` carries extra
// context, e.g. { plan: "deployer" } when opening the plan-select flow pre-selected.
export function PopupProvider({ children }) {
  const [popup, setPopup] = useState(null); // { key, payload } | null

  function open(destination, payload = {}) {
    const key = destination.startsWith("popup:") ? destination.slice(6) : destination;
    setPopup({ key, payload });
  }
  function close() {
    setPopup(null);
  }

  return (
    <PopupContext.Provider value={{ popup, open, close }}>
      {children}
    </PopupContext.Provider>
  );
}

export const usePopup = () => useContext(PopupContext);
