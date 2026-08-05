import { X } from "lucide-react";

export default function Modal({ onClose, children, title }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="card w-full sm:max-w-md max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between p-4 border-b border-border dark:border-border-dark sticky top-0 bg-surface dark:bg-surface-dark">
          <h3 className="heading text-lg">{title}</h3>
          <button onClick={onClose} className="text-muted dark:text-muted-dark"><X size={20} /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
