/**
 * 信道频率响应图组件
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Complex } from '@/utils/ofdm';

interface ChannelResponseChartProps {
  channelResponse: Complex[];
  channelEstimate?: Complex[];
  title?: string;
}

export function ChannelResponseChart({
  channelResponse,
  channelEstimate,
  title = '信道频率响应',
}: ChannelResponseChartProps) {
  // 转换数据
  const data = channelResponse.map((h, index) => ({
    index,
    actualMagnitude: h.magnitude(),
    actualPhase: h.phase(),
    estimatedMagnitude: channelEstimate?.[index]?.magnitude() || 0,
    estimatedPhase: channelEstimate?.[index]?.phase() || 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 幅度响应 */}
          <div>
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">幅度响应</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="index"
                  label={{ value: '子载波索引', position: 'insideBottom', offset: -5 }}
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
                <Line
                  type="monotone"
                  dataKey="actualMagnitude"
                  name="实际信道"
                  stroke="hsl(var(--primary))"
                  dot={false}
                  strokeWidth={2}
                />
                {channelEstimate && (
                  <Line
                    type="monotone"
                    dataKey="estimatedMagnitude"
                    name="估计信道"
                    stroke="hsl(var(--secondary))"
                    dot={false}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 相位响应 */}
          <div>
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">相位响应</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="index"
                  label={{ value: '子载波索引', position: 'insideBottom', offset: -5 }}
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
                <Line
                  type="monotone"
                  dataKey="actualPhase"
                  name="实际信道"
                  stroke="hsl(var(--primary))"
                  dot={false}
                  strokeWidth={2}
                />
                {channelEstimate && (
                  <Line
                    type="monotone"
                    dataKey="estimatedPhase"
                    name="估计信道"
                    stroke="hsl(var(--secondary))"
                    dot={false}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
