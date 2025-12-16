/**
 * 星座图组件
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Complex } from '@/utils/ofdm';

interface ConstellationChartProps {
  transmittedSymbols: Complex[];
  receivedSymbols?: Complex[];
  title?: string;
}

export function ConstellationChart({
  transmittedSymbols,
  receivedSymbols,
  title = '星座图',
}: ConstellationChartProps) {
  // 转换发送符号数据
  const txData = transmittedSymbols.map((symbol, index) => ({
    real: symbol.real,
    imag: symbol.imag,
    index,
  }));

  // 转换接收符号数据
  const rxData = receivedSymbols?.map((symbol, index) => ({
    real: symbol.real,
    imag: symbol.imag,
    index,
  })) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              type="number"
              dataKey="real"
              name="实部"
              domain={[-2, 2]}
              stroke="hsl(var(--foreground))"
              tick={{ fill: 'hsl(var(--foreground))' }}
            />
            <YAxis
              type="number"
              dataKey="imag"
              name="虚部"
              domain={[-2, 2]}
              stroke="hsl(var(--foreground))"
              tick={{ fill: 'hsl(var(--foreground))' }}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--popover-foreground))',
              }}
            />
            <Legend />
            {receivedSymbols && (
              <Scatter
                name="接收符号"
                data={rxData}
                fill="hsl(var(--destructive))"
                fillOpacity={0.6}
                shape="circle"
              />
            )}
            <Scatter
              name="发送符号"
              data={txData}
              fill="hsl(var(--primary))"
              shape="cross"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
