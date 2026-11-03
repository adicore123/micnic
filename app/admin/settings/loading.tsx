export default function SettingsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-2xl border border-crust-700/10 bg-white p-6 shadow-sm">
          <div className="h-6 w-44 rounded bg-crust-700/10" />
          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="h-32 w-32 rounded-2xl bg-crust-700/5" />
            <div className="flex-1 space-y-4">
              <div className="h-12 w-full rounded-xl bg-crust-700/5" />
              <div className="h-12 w-2/3 rounded-xl bg-crust-700/5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
