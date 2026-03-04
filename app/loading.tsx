export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
        <p className="text-sm font-medium text-slate-500">Loading SmartSite...</p>
      </div>
    </div>
  );
}
