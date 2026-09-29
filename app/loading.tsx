export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background text-foreground" role="status" aria-live="polite">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
        正在准备工作台
      </div>
    </main>
  )
}
