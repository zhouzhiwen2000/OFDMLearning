/**
 * 子载波分布图组件
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SubcarrierDistributionProps {
  numSubcarriers: number;
  pilotSpacing: number;
}

export function SubcarrierDistribution({
  numSubcarriers,
  pilotSpacing,
}: SubcarrierDistributionProps) {
  // 生成子载波数组
  const subcarriers = Array.from({ length: numSubcarriers }, (_, i) => ({
    index: i,
    isPilot: i % pilotSpacing === 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">子载波分布</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 图例 */}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-primary rounded-sm"></div>
              <span>数据子载波</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-destructive rounded-sm"></div>
              <span>导频子载波</span>
            </div>
          </div>

          {/* 网格展示 */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(20px,1fr))] gap-1">
            <TooltipProvider>
              {subcarriers.map((sc) => (
                <Tooltip key={sc.index}>
                  <TooltipTrigger asChild>
                    <div
                      className={`
                        aspect-square rounded-sm text-[10px] flex items-center justify-center cursor-help transition-colors
                        ${sc.isPilot ? 'bg-destructive text-destructive-foreground font-bold' : 'bg-primary/20 text-primary-foreground hover:bg-primary/40'}
                      `}
                    >
                      {sc.index}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>索引: {sc.index}</p>
                    <p>类型: {sc.isPilot ? '导频' : '数据'}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
          
          <div className="text-xs text-muted-foreground">
            总计: {numSubcarriers} 个子载波，其中 {Math.ceil(numSubcarriers / pilotSpacing)} 个导频，{numSubcarriers - Math.ceil(numSubcarriers / pilotSpacing)} 个数据
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
