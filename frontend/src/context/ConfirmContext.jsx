import { createContext, useContext, useState, useCallback } from "react";

const ConfirmContext = createContext(null);

// Replaces window.confirm(...) everywhere with a styled in-app dialog (native
// confirm() shows the browser's own "yoursite.com says..." chrome, which we
// don't want). Usage: const confirm = useConfirm(); if (await confirm("Delete this?")) { ... }
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null); // { message, resolve } | null

  const confirm = useCallback((message) => {
    return new Promise((resolve) => {
      setState({ message, resolve });
    });
  }, []);

  function handle(result) {
    state?.resolve(result);
    setState(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={() => handle(false)}>
          <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-2xl p-6 w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-body text-text dark:text-text-dark mb-5">{state.message}</p>
            <div className="flex gap-2">
              <button onClick={() => handle(true)} className="btn-primary flex-1 text-sm">Yes</button>
              <button onClick={() => handle(false)} className="btn-outline flex-1 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext);
