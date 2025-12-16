/**
 * 信号波形图组件（时域/频域）
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Complex } from '@/utils/ofdm';

interface SignalChartProps {
  signal: Complex[];
  title?: string;
  xLabel?: string;
  showMagnitude?: boolean;
  showPhase?: boolean;
  showReal?: boolean;
  showImag?: boolean;
}

export function SignalChart({
  signal,
  title = '信号波形',
  xLabel = '采样点',
  showMagnitude = true,
  showPhase = false,
  showReal = false,
  showImag = false,
}: SignalChartProps) {
  // 转换数据
  const data = signal.map((s, index) => ({
    index,
    magnitude: s.magnitude(),
    phase: s.phase(),
    real: s.real,
    imag: s.imag,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="index"
              label={{ value: xLabel, position: 'insideBottom', offset: -5 }}
              stroke="hsl(var(--foreground))"
              tick={{ fill: 'hsl(var(--foreground))' }}
            />
            <YAxis
              stroke="hsl(var(--foreground))"
              tick={{ fill: 'hsl(var(--foreground))' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--popover-foreground))',
              }}
            />
            <Legend />
            {showMagnitude && (
              <Line
                type="monotone"
                dataKey="magnitude"
                name="幅度"
                stroke="hsl(var(--primary))"
                dot={false}
                strokeWidth={2}
              />
            )}
            {showPhase && (
              <Line
                type="monotone"
                dataKey="phase"
                name="相位"
                stroke="hsl(var(--secondary))"
                dot={false}
                strokeWidth={2}
              />
            )}
            {showReal && (
              <Line
                type="monotone"
                dataKey="real"
                name="实部"
                stroke="hsl(var(--chart-1))"
                dot={false}
                strokeWidth={2}
              />
            )}
            {showImag && (
              <Line
                type="monotone"
                dataKey="imag"
                name="虚部"
                stroke="hsl(var(--chart-2))"
                dot={false}
                strokeWidth={2}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
