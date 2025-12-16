/**
 * 参数控制面板组件
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { OFDMParameters, MultipathParameters } from '@/types/ofdm';

interface ParameterPanelProps {
  parameters: OFDMParameters;
  multipathParams: MultipathParameters;
  onParametersChange: (params: OFDMParameters) => void;
  onMultipathChange: (params: MultipathParameters) => void;
  onSimulate: () => void;
  isSimulating?: boolean;
}

export function ParameterPanel({
  parameters,
  multipathParams,
  onParametersChange,
  onMultipathChange,
  onSimulate,
  isSimulating = false,
}: ParameterPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-xl">⚙️</span>
          参数配置
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">基本参数</TabsTrigger>
            <TabsTrigger value="channel">信道参数</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6 mt-4">
            {/* 子载波数量 */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>子载波数量</Label>
                <span className="text-sm text-muted-foreground">{parameters.numSubcarriers}</span>
              </div>
              <Slider
                value={[parameters.numSubcarriers]}
                onValueChange={([value]) =>
                  onParametersChange({ ...parameters, numSubcarriers: value })
                }
                min={64}
                max={512}
                step={64}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">范围: 64 - 512</p>
            </div>

            {/* 调制方式 */}
            <div className="space-y-2">
              <Label>调制方式</Label>
              <Select
                value={parameters.modulationType}
                onValueChange={(value: 'QPSK' | '16QAM' | '64QAM') =>
                  onParametersChange({ ...parameters, modulationType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="QPSK">QPSK (4-QAM)</SelectItem>
                  <SelectItem value="16QAM">16-QAM</SelectItem>
                  <SelectItem value="64QAM">64-QAM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 导频间隔 */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>导频间隔</Label>
                <span className="text-sm text-muted-foreground">{parameters.pilotSpacing}</span>
              </div>
              <Slider
                value={[parameters.pilotSpacing]}
                onValueChange={([value]) =>
                  onParametersChange({ ...parameters, pilotSpacing: value })
                }
                min={4}
                max={16}
                step={2}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">范围: 4 - 16</p>
            </div>

            {/* 导频功率 */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>导频功率</Label>
                <span className="text-sm text-muted-foreground">{parameters.pilotPower.toFixed(1)}</span>
              </div>
              <Slider
                value={[parameters.pilotPower]}
                onValueChange={([value]) =>
                  onParametersChange({ ...parameters, pilotPower: value })
                }
                min={0.5}
                max={2.0}
                step={0.1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">范围: 0.5 - 2.0</p>
            </div>

            {/* 信噪比 */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>信噪比 (SNR)</Label>
                <span className="text-sm text-muted-foreground">{parameters.snrDB} dB</span>
              </div>
              <Slider
                value={[parameters.snrDB]}
                onValueChange={([value]) =>
                  onParametersChange({ ...parameters, snrDB: value })
                }
                min={0}
                max={30}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">范围: 0 - 30 dB</p>
            </div>

            {/* 信道类型 */}
            <div className="space-y-2">
              <Label>信道类型</Label>
              <Select
                value={parameters.channelType}
                onValueChange={(value: 'awgn' | 'multipath') =>
                  onParametersChange({ ...parameters, channelType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="awgn">AWGN信道</SelectItem>
                  <SelectItem value="multipath">多径信道</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="channel" className="space-y-6 mt-4">
            {parameters.channelType === 'multipath' ? (
              <>
                {/* 路径1 */}
                <div className="space-y-3 p-3 border border-border rounded-lg">
                  <h4 className="font-medium text-sm">路径 1</h4>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-xs">时延 (采样点)</Label>
                      <span className="text-xs text-muted-foreground">{multipathParams.path1Delay}</span>
                    </div>
                    <Slider
                      value={[multipathParams.path1Delay]}
                      onValueChange={([value]) =>
                        onMultipathChange({ ...multipathParams, path1Delay: value })
                      }
                      min={0}
                      max={10}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-xs">增益</Label>
                      <span className="text-xs text-muted-foreground">{multipathParams.path1Gain.toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[multipathParams.path1Gain]}
                      onValueChange={([value]) =>
                        onMultipathChange({ ...multipathParams, path1Gain: value })
                      }
                      min={0}
                      max={1}
                      step={0.05}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-xs">相位 (度)</Label>
                      <span className="text-xs text-muted-foreground">{Math.round((multipathParams.path1Phase * 180) / Math.PI)}</span>
                    </div>
                    <Slider
                      value={[(multipathParams.path1Phase * 180) / Math.PI]}
                      onValueChange={([value]) =>
                        onMultipathChange({ ...multipathParams, path1Phase: (value * Math.PI) / 180 })
                      }
                      min={0}
                      max={360}
                      step={15}
                    />
                  </div>
                </div>

                {/* 路径2 */}
                <div className="space-y-3 p-3 border border-border rounded-lg">
                  <h4 className="font-medium text-sm">路径 2</h4>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-xs">时延 (采样点)</Label>
                      <span className="text-xs text-muted-foreground">{multipathParams.path2Delay}</span>
                    </div>
                    <Slider
                      value={[multipathParams.path2Delay]}
                      onValueChange={([value]) =>
                        onMultipathChange({ ...multipathParams, path2Delay: value })
                      }
                      min={0}
                      max={10}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-xs">增益</Label>
                      <span className="text-xs text-muted-foreground">{multipathParams.path2Gain.toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[multipathParams.path2Gain]}
                      onValueChange={([value]) =>
                        onMultipathChange({ ...multipathParams, path2Gain: value })
                      }
                      min={0}
                      max={1}
                      step={0.05}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-xs">相位 (度)</Label>
                      <span className="text-xs text-muted-foreground">{Math.round((multipathParams.path2Phase * 180) / Math.PI)}</span>
                    </div>
                    <Slider
                      value={[(multipathParams.path2Phase * 180) / Math.PI]}
                      onValueChange={([value]) =>
                        onMultipathChange({ ...multipathParams, path2Phase: (value * Math.PI) / 180 })
                      }
                      min={0}
                      max={360}
                      step={15}
                    />
                  </div>
                </div>

                {/* 路径3 */}
                <div className="space-y-3 p-3 border border-border rounded-lg">
                  <h4 className="font-medium text-sm">路径 3</h4>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-xs">时延 (采样点)</Label>
                      <span className="text-xs text-muted-foreground">{multipathParams.path3Delay}</span>
                    </div>
                    <Slider
                      value={[multipathParams.path3Delay]}
                      onValueChange={([value]) =>
                        onMultipathChange({ ...multipathParams, path3Delay: value })
                      }
                      min={0}
                      max={10}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-xs">增益</Label>
                      <span className="text-xs text-muted-foreground">{multipathParams.path3Gain.toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[multipathParams.path3Gain]}
                      onValueChange={([value]) =>
                        onMultipathChange({ ...multipathParams, path3Gain: value })
                      }
                      min={0}
                      max={1}
                      step={0.05}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-xs">相位 (度)</Label>
                      <span className="text-xs text-muted-foreground">{Math.round((multipathParams.path3Phase * 180) / Math.PI)}</span>
                    </div>
                    <Slider
                      value={[(multipathParams.path3Phase * 180) / Math.PI]}
                      onValueChange={([value]) =>
                        onMultipathChange({ ...multipathParams, path3Phase: (value * Math.PI) / 180 })
                      }
                      min={0}
                      max={360}
                      step={15}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>AWGN信道无需额外配置</p>
                <p className="text-sm mt-2">仅添加高斯白噪声</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* 仿真按钮 */}
        <Button
          onClick={onSimulate}
          disabled={isSimulating}
          className="w-full"
          size="lg"
        >
          {isSimulating ? '仿真中...' : '开始仿真'}
        </Button>
      </CardContent>
    </Card>
  );
}
