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

interface SliderWithButtonsProps {
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  className?: string;
}

function SliderWithButtons({ value, onValueChange, min, max, step, className }: SliderWithButtonsProps) {
  const handleDecrement = () => {
    const newValue = Math.max(min, Number((value - step).toFixed(2)));
    onValueChange(newValue);
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, Number((value + step).toFixed(2)));
    onValueChange(newValue);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={handleDecrement}
        disabled={value <= min}
      >
        -
      </Button>
      <Slider
        value={[value]}
        onValueChange={([v]) => onValueChange(v)}
        min={min}
        max={max}
        step={step}
        className="flex-1"
      />
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={handleIncrement}
        disabled={value >= max}
      >
        +
      </Button>
    </div>
  );
}

interface ParameterPanelProps {
  parameters: OFDMParameters;
  multipathParams: MultipathParameters;
  onParametersChange: (params: OFDMParameters) => void;
  onMultipathChange: (params: MultipathParameters) => void;
  onRandomizeChannel: () => void;
  onSimulate: () => void;
  isSimulating?: boolean;
}

export function ParameterPanel({
  parameters,
  multipathParams,
  onParametersChange,
  onMultipathChange,
  onRandomizeChannel,
  onSimulate,
  isSimulating = false,
}: ParameterPanelProps) {
  // 计算2的指数选项
  const powerOfTwoOptions = [64, 128, 256, 512, 1024, 2048];

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
                <Label>子载波数量（2的指数）</Label>
                <span className="text-sm text-muted-foreground">{parameters.numSubcarriers}</span>
              </div>
              <Select
                value={parameters.numSubcarriers.toString()}
                onValueChange={(value) =>
                  onParametersChange({ ...parameters, numSubcarriers: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {powerOfTwoOptions.map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n} (2^{Math.log2(n)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* CP长度 */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>循环前缀长度</Label>
                <span className="text-sm text-muted-foreground">{parameters.cpLength}</span>
              </div>
              <SliderWithButtons
                value={parameters.cpLength}
                onValueChange={(value) =>
                  onParametersChange({ ...parameters, cpLength: value })
                }
                min={0}
                max={Math.floor(parameters.numSubcarriers / 4)}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                范围: 0 - {Math.floor(parameters.numSubcarriers / 4)}
              </p>
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
              <Select
                value={parameters.pilotSpacing.toString()}
                onValueChange={(value) =>
                  onParametersChange({ ...parameters, pilotSpacing: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: Math.log2(parameters.numSubcarriers) + 1 }, (_, i) => Math.pow(2, i)).map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">范围: 1 - {parameters.numSubcarriers} (2的指数)</p>
            </div>

            {/* 导频功率 */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>导频功率</Label>
                <span className="text-sm text-muted-foreground">{parameters.pilotPower.toFixed(1)}</span>
              </div>
              <SliderWithButtons
                value={parameters.pilotPower}
                onValueChange={(value) =>
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
              <SliderWithButtons
                value={parameters.snrDB}
                onValueChange={(value) =>
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

            {/* 插值类型 */}
            <div className="space-y-2">
              <Label>信道插值方法</Label>
              <Select
                value={parameters.interpolationType}
                onValueChange={(value: 'linear' | 'polar' | 'dft') =>
                  onParametersChange({ ...parameters, interpolationType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">直角坐标线性插值</SelectItem>
                  <SelectItem value="polar">极坐标线性插值</SelectItem>
                  <SelectItem value="dft">DFT插值</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {parameters.interpolationType === 'linear' && '对实部和虚部分别插值'}
                {parameters.interpolationType === 'polar' && '对幅度和相位分别插值'}
                {parameters.interpolationType === 'dft' && 'IDFT到时延域，阈值滤波后DFT回频域'}
              </p>
            </div>

            {/* DFT插值阈值（仅在选择DFT插值时显示） */}
            {parameters.interpolationType === 'dft' && (
              <div className="space-y-2 p-3 border border-border rounded-lg bg-muted/30">
                <div className="flex justify-between">
                  <Label>DFT阈值（时延索引）</Label>
                  <span className="text-sm text-muted-foreground">{parameters.dftThreshold}</span>
                </div>
                <SliderWithButtons
                  value={parameters.dftThreshold}
                  onValueChange={(value) =>
                    onParametersChange({ ...parameters, dftThreshold: value })
                  }
                  min={1}
                  max={Math.floor(parameters.numSubcarriers / 2)}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  高于此索引的时延分量将被置零（范围: 1 - {Math.floor(parameters.numSubcarriers / 2)}）
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="channel" className="space-y-6 mt-4">
            {parameters.channelType === 'multipath' ? (
              <>
                {/* 随机生成按钮 */}
                <div className="space-y-3 p-3 border border-border rounded-lg bg-muted/30">
                  <Label>随机生成多径参数</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    根据指定的时延扩展和路径数量，自动生成符合指数衰减模型的信道参数
                  </p>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-sm">时延扩展 (Delay Spread)</Label>
                      <span className="text-sm text-muted-foreground">
                        {multipathParams.delaySpread} 采样点
                      </span>
                    </div>
                    <SliderWithButtons
                      value={multipathParams.delaySpread}
                      onValueChange={(value) =>
                        onMultipathChange({ ...multipathParams, delaySpread: value })
                      }
                      min={1}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">范围: 1 - 100 采样点</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-sm">路径数量</Label>
                      <span className="text-sm text-muted-foreground">
                        {multipathParams.numPaths}
                      </span>
                    </div>
                    <SliderWithButtons
                      value={multipathParams.numPaths}
                      onValueChange={(value) => {
                        const newNumPaths = value;
                        const currentPaths = [...multipathParams.paths];
                        
                        // 如果增加路径数，添加新路径
                        while (currentPaths.length < newNumPaths) {
                          currentPaths.push({
                            delay: 0,
                            gain: 0.1,
                            phase: 0,
                          });
                        }
                        
                        // 如果减少路径数，删除多余路径
                        while (currentPaths.length > newNumPaths) {
                          currentPaths.pop();
                        }
                        
                        onMultipathChange({
                          ...multipathParams,
                          numPaths: newNumPaths,
                          paths: currentPaths,
                        });
                      }}
                      min={1}
                      max={5}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">范围: 1 - 5 条路径</p>
                  </div>

                  <Button 
                    onClick={onRandomizeChannel} 
                    variant="secondary" 
                    className="w-full"
                  >
                    🎲 生成随机信道参数
                  </Button>
                </div>

                {/* 手动配置路径参数 */}
                {multipathParams.paths.map((path, index) => (
                  <div key={index} className="space-y-3 p-3 border border-border rounded-lg">
                    <h4 className="font-medium text-sm">路径 {index + 1}</h4>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="text-xs">时延 (采样点)</Label>
                        <span className="text-xs text-muted-foreground">{path.delay}</span>
                      </div>
                      <SliderWithButtons
                        value={path.delay}
                        onValueChange={(value) => {
                          const newPaths = [...multipathParams.paths];
                          newPaths[index] = { ...newPaths[index], delay: Math.round(value) };
                          onMultipathChange({ ...multipathParams, paths: newPaths });
                        }}
                        min={0}
                        max={255}
                        step={1}
                      />
                      <p className="text-xs text-muted-foreground">范围: 0 - 255</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="text-xs">增益</Label>
                        <span className="text-xs text-muted-foreground">{path.gain.toFixed(2)}</span>
                      </div>
                      <SliderWithButtons
                        value={path.gain}
                        onValueChange={(value) => {
                          const newPaths = [...multipathParams.paths];
                          newPaths[index] = { ...newPaths[index], gain: value };
                          onMultipathChange({ ...multipathParams, paths: newPaths });
                        }}
                        min={0}
                        max={1}
                        step={0.05}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="text-xs">相位 (度)</Label>
                        <span className="text-xs text-muted-foreground">{Math.round((path.phase * 180) / Math.PI)}</span>
                      </div>
                      <SliderWithButtons
                        value={(path.phase * 180) / Math.PI}
                        onValueChange={(value) => {
                          const newPaths = [...multipathParams.paths];
                          newPaths[index] = { ...newPaths[index], phase: (value * Math.PI) / 180 };
                          onMultipathChange({ ...multipathParams, paths: newPaths });
                        }}
                        min={0}
                        max={360}
                        step={15}
                      />
                    </div>
                  </div>
                ))}
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
