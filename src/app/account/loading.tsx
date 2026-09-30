export default function AccountLoading() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl items-center px-6 py-14 sm:px-12 sm:py-20" aria-label="Loading your account">
      <div className="w-full animate-pulse border-y border-border py-10 motion-reduce:animate-none sm:py-14">
        <div className="h-3 w-44 rounded bg-muted" />
        <div className="mt-6 h-16 max-w-lg rounded bg-muted" />
        <div className="mt-5 h-5 max-w-xl rounded bg-muted" />
        <div className="mt-10 h-80 rounded-3xl border border-border bg-muted/50" />
      </div>
    </main>
  );
}
