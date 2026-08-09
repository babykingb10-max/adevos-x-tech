export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-bg-dark">
      <div className="relative w-24 h-24 mb-5">
        <div
          className="absolute inset-0 rounded-full border-4 border-brand-dark/15 border-t-brand-dark"
          style={{ animation: "adevos-spin 1s linear infinite" }}
        />
        <img src="/icons/icon-192.png" alt="Adevos-X Tech" className="absolute inset-[14px] w-[68px] h-[68px] rounded-full" />
      </div>
      <p className="font-display font-semibold text-brand-dark tracking-wide text-sm">
        Adevos-X Tech Initializing...
      </p>

      <style>{`@keyframes adevos-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
