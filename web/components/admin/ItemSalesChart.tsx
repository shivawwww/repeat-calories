'use client'

interface ItemSale {
  name: string
  total_qty: number
}

export default function ItemSalesChart({ data }: { data: ItemSale[] }) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-ink-soft">No sales recorded yet.</p>
  }

  const max = Math.max(...data.map((d) => d.total_qty))

  return (
    <div className="flex flex-col gap-3.5">
      {data.map((d, idx) => {
        const pct = Math.max((d.total_qty / max) * 100, 4)
        return (
          <div key={d.name} className="group">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-ink">
                {idx === 0 && <span title="Top seller">🏆</span>}
                {d.name}
              </span>
              <span className="stat-figure font-bold text-ink-soft">{d.total_qty} sold</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-cream-deep/50" title={`${d.name}: ${d.total_qty} sold`}>
              <div
                className="h-full rounded-full bg-orange transition-all duration-500 group-hover:bg-orange-dark"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
