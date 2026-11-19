import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { dayLabel, money, moneyShort } from "@/lib/format";

type Point = { day: string; net: number; margin: number };

export function RevenueChart({ data, height = 240 }: { data: Point[]; height?: number | undefined }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gNet" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gMargin" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="day" tickFormatter={(d: string) => dayLabel(d)} tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" minTickGap={24} />
          <YAxis tickFormatter={(v: number) => (v >= 1000 ? `${moneyShort(v / 1000)} k` : moneyShort(v))} tickLine={false} axisLine={false} fontSize={11} width={52} stroke="var(--muted-foreground)" />
          <Tooltip
            cursor={{ stroke: "var(--border)" }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lift">
                  <p className="mb-1 font-medium">{dayLabel(String(label))}</p>
                  <p className="tnum">Chiffre d'affaires : {money(Number(payload[0]?.value ?? 0))}</p>
                  <p className="tnum text-muted-foreground">Bénéfice brut : {money(Number(payload[1]?.value ?? 0))}</p>
                </div>
              ) : null
            }
          />
          <Area type="monotone" dataKey="net" stroke="var(--chart-1)" strokeWidth={2} fill="url(#gNet)" />
          <Area type="monotone" dataKey="margin" stroke="var(--chart-2)" strokeWidth={2} fill="url(#gMargin)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
