export default function ShareLoading() {
  return (
    <div className="animate-pulse space-y-10">
      <div className="h-7 w-56 rounded-lg bg-crust-700/10" />
      <div className="grid items-start gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-crust-700/10 bg-white p-6 shadow-sm">
          <div className="h-6 w-48 rounded bg-crust-700/10" />
          <div className="mt-3 h-4 w-full rounded bg-crust-700/5" />
          <div className="mt-6 h-12 w-full rounded-xl bg-crust-700/5" />
          <div className="mt-4 h-16 w-full rounded-2xl bg-crust-700/10" />
        </div>
        <div className="rounded-[2rem] bg-crust-800/50 p-10">
          <div className="mx-auto h-28 w-28 rounded-full bg-crust-700/20" />
          <div className="mx-auto mt-5 h-8 w-44 rounded bg-crust-700/20" />
          <div className="mx-auto mt-7 h-[270px] w-[270px] rounded-3xl bg-crust-700/10" />
        </div>
      </div>
    </div>
  );
}
