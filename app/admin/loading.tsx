export default function AdminLoading() {
  return (
    <div className="grid animate-pulse items-start gap-8 lg:grid-cols-[400px_1fr]">
      <div className="h-fit rounded-2xl border border-crust-700/10 bg-white p-6 shadow-sm">
        <div className="h-6 w-40 rounded-lg bg-crust-700/10" />
        <div className="mt-3 h-4 w-full rounded bg-crust-700/5" />
        <div className="mt-6 h-12 w-full rounded-xl bg-crust-700/5" />
        <div className="mt-4 h-12 w-full rounded-xl bg-crust-700/5" />
        <div className="mt-4 h-8 w-full rounded-xl bg-crust-700/5" />
        <div className="mt-6 h-14 w-full rounded-xl bg-crust-700/10" />
      </div>
      <div>
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-crust-700/10 bg-white px-4 py-4 shadow-sm">
              <div className="mx-auto h-7 w-7 rounded-full bg-crust-700/10" />
              <div className="mx-auto mt-2 h-6 w-10 rounded bg-crust-700/10" />
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-2xl border border-crust-700/10 bg-white shadow-sm">
          <div className="p-4">
            <div className="h-11 w-full rounded-xl bg-crust-700/5" />
          </div>
          <div className="space-y-3 p-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-4 w-12 rounded bg-crust-700/10" />
                <div className="h-4 w-28 rounded bg-crust-700/10" />
                <div className="h-4 w-24 rounded bg-crust-700/5" />
                <div className="ms-auto h-8 w-8 rounded-full bg-crust-700/5" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
