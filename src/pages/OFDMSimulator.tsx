/**
 * OFDM通信系统演示主页面
 */

import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ParameterPanel } from '@/components/ofdm/ParameterPanel';
import { ConstellationChart } from '@/components/ofdm/ConstellationChart';
import { SignalChart } from '@/components/ofdm/SignalChart';
import { ChannelResponseChart } from '@/components/ofdm/ChannelResponseChart';
import type { OFDMParameters, MultipathParameters, SimulationResult } from '@/types/ofdm';
import {
  Complex,
  QAMModulator,
  FFT,
  OFDMSymbolGenerator,
  ChannelSimulator,
  ChannelEstimator,
  ChannelEqualizer,
  addAWGN,
  calculateBER,
  generateRandomBits,
  addCyclicPrefix,
  removeCyclicPrefix,
  generateRandomMultipathChannel,
} from '@/utils/ofdm';

export default function OFDMSimulator() {
  // 默认参数
  const [parameters, setParameters] = useState<OFDMParameters>({
    numSubcarriers: 128,
    cpLength: 16,
    modulationType: 'QPSK',
    pilotSpacing: 8,
    pilotPower: 1.0,
    snrDB: 15,
    channelType: 'multipath',
    interpolationType: 'linear',
    dftThreshold: 32,
  });

  const [multipathParams, setMultipathParams] = useState<MultipathParameters>({
    useRandom: false,
    delaySpread: 10,
    numPaths: 3,
    paths: [
      { delay: 0, gain: 1.0, phase: 0 },
      { delay: 2, gain: 0.5, phase: Math.PI / 4 },
      { delay: 4, gain: 0.3, phase: Math.PI / 2 },
    ],
  });

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // 随机生成多径参数（按钮触发）
  const randomizeChannel = useCallback(() => {
    const randomChannel = generateRandomMultipathChannel(
      multipathParams.delaySpread,
      multipathParams.numPaths
    );

    // 更新多径参数
    const newPaths: { delay: number; gain: number; phase: number }[] = [];
    for (let i = 0; i < multipathParams.numPaths; i++) {
      newPaths.push({
        delay: Math.round(randomChannel.delays[i] || 0),
        gain: randomChannel.gains[i] || 0,
        phase: randomChannel.phases[i] || 0,
      });
    }

    setMultipathParams(prev => ({
      ...prev,
      paths: newPaths,
    }));
  }, [multipathParams.delaySpread, multipathParams.numPaths]);

  // 执行仿真
  const runSimulation = useCallback(() => {
    setIsSimulating(true);

    // 使用setTimeout让UI有时间更新
    setTimeout(() => {
      try {
        // 1. 生成随机比特流
        const numDataSymbols = Math.floor(
          (parameters.numSubcarriers * (parameters.pilotSpacing - 1)) / parameters.pilotSpacing
        );
        const bitsPerSymbol = Math.log2(
          parameters.modulationType === 'QPSK' ? 4 : parameters.modulationType === '16QAM' ? 16 : 64
        );
        const numBits = Math.floor(numDataSymbols * bitsPerSymbol);
        const transmittedBits = generateRandomBits(numBits);

        // 2. QAM调制
        const modulator = new QAMModulator(parameters.modulationType);
        const dataSymbols = modulator.modulate(transmittedBits);

        // 3. 插入导频
        const symbolGenerator = new OFDMSymbolGenerator(parameters.numSubcarriers, {
          spacing: parameters.pilotSpacing,
          power: parameters.pilotPower,
        });
        const ofdmSymbol = symbolGenerator.insertPilots(dataSymbols);

        // 4. IFFT（生成时域信号）
        let timeSignal = FFT.ifft(ofdmSymbol);

        // 5. 添加循环前缀
        if (parameters.cpLength > 0) {
          timeSignal = addCyclicPrefix(timeSignal, parameters.cpLength);
        }

        // 6. 通过信道
        let receivedSignal: Complex[];
        let channelResponse: Complex[];

        if (parameters.channelType === 'multipath') {
          // 使用手动设置的参数
          const channelParams = {
            delays: multipathParams.paths.map(p => p.delay),
            gains: multipathParams.paths.map(p => p.gain),
            phases: multipathParams.paths.map(p => p.phase),
          };

          const channel = new ChannelSimulator(channelParams);
          receivedSignal = channel.applyChannel(timeSignal);
          channelResponse = channel.getFrequencyResponse(parameters.numSubcarriers);
        } else {
          // AWGN信道
          receivedSignal = timeSignal;
          channelResponse = Array(parameters.numSubcarriers).fill(new Complex(1, 0));
        }

        // 7. 添加噪声
        receivedSignal = addAWGN(receivedSignal, parameters.snrDB);

        // 8. 移除循环前缀
        if (parameters.cpLength > 0) {
          receivedSignal = removeCyclicPrefix(receivedSignal, parameters.cpLength);
        }

        // 9. FFT（转换到频域）
        const receivedFreqSignal = FFT.fft(receivedSignal.slice(0, parameters.numSubcarriers));

        // 10. 信道估计（使用选择的插值方法）
        const { pilots, pilotIndices } = symbolGenerator.extractPilots(receivedFreqSignal);
        const transmittedPilots = symbolGenerator.getZCSequence(); // 获取发送的ZC导频序列
        const channelEstimate = ChannelEstimator.estimate(
          pilots,
          pilotIndices,
          transmittedPilots,
          parameters.numSubcarriers,
          parameters.interpolationType,
          parameters.dftThreshold
        );

        // 11. 信道均衡
        const snrLinear = 10 ** (parameters.snrDB / 10);
        const equalizedSymbols = ChannelEqualizer.mmse(
          receivedFreqSignal,
          channelEstimate,
          snrLinear
        );

        // 10. 提取数据符号
        const receivedDataSymbols = symbolGenerator.extractData(equalizedSymbols);

        // 11. QAM解调
        const receivedBits = modulator.demodulate(receivedDataSymbols);

        // 12. 计算误码率
        const ber = calculateBER(transmittedBits, receivedBits);

        // 保存结果
        setResult({
          transmittedBits,
          receivedBits,
          transmittedSymbols: dataSymbols,
          receivedSymbols: receivedDataSymbols,
          equalizedSymbols: receivedDataSymbols,
          timeSignal,
          freqSignal: ofdmSymbol,
          channelResponse,
          channelEstimate,
          ber,
        });
      } catch (error) {
        console.error('仿真错误:', error);
      } finally {
        setIsSimulating(false);
      }
    }, 100);
  }, [parameters, multipathParams]);

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航栏 */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">OFDM通信系统演示平台</h1>
              <p className="text-sm text-muted-foreground mt-1">
                正交频分复用技术全流程交互式仿真
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                教育演示
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* 左侧参数面板 */}
          <div className="xl:col-span-1">
            <ParameterPanel
              parameters={parameters}
              multipathParams={multipathParams}
              onParametersChange={setParameters}
              onMultipathChange={setMultipathParams}
              onRandomizeChannel={randomizeChannel}
              onSimulate={runSimulation}
              isSimulating={isSimulating}
            />
          </div>

          {/* 右侧可视化区域 */}
          <div className="xl:col-span-3 space-y-6">
            {result ? (
              <>
                {/* 系统状态信息 */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">误码率</p>
                        <p className="text-2xl font-bold text-primary mt-1">
                          {result.ber.toExponential(2)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">调制方式</p>
                        <p className="text-2xl font-bold text-foreground mt-1">
                          {parameters.modulationType}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">子载波数</p>
                        <p className="text-2xl font-bold text-foreground mt-1">
                          {parameters.numSubcarriers}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">信噪比</p>
                        <p className="text-2xl font-bold text-foreground mt-1">
                          {parameters.snrDB} dB
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 星座图对比 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ConstellationChart
                    transmittedSymbols={result.transmittedSymbols}
                    title="发送端星座图"
                  />
                  <ConstellationChart
                    transmittedSymbols={result.transmittedSymbols}
                    receivedSymbols={result.receivedSymbols}
                    title="接收端星座图对比"
                  />
                </div>

                {/* 时域和频域信号 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SignalChart
                    signal={result.timeSignal}
                    title="时域信号"
                    xLabel="时间采样点"
                    showMagnitude={true}
                    showReal={true}
                    showImag={true}
                  />
                  <SignalChart
                    signal={result.freqSignal}
                    title="频域信号（子载波）"
                    xLabel="子载波索引"
                    showMagnitude={true}
                  />
                </div>

                {/* 信道频率响应 */}
                <ChannelResponseChart
                  channelResponse={result.channelResponse}
                  channelEstimate={result.channelEstimate}
                  title="信道频率响应与估计"
                />
              </>
            ) : (
              <Card>
                <CardContent className="py-20">
                  <div className="text-center text-muted-foreground">
                    <div className="text-6xl mb-4">📡</div>
                    <h3 className="text-xl font-medium mb-2">准备开始仿真</h3>
                    <p className="text-sm">
                      请在左侧配置参数，然后点击"开始仿真"按钮查看结果
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* 底部状态栏 */}
      <footer className="border-t border-border bg-card mt-8">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
            <p>© 2025 OFDM通信系统演示平台 - 教育用途</p>
            <div className="flex items-center gap-4">
              <span>状态: {isSimulating ? '仿真中...' : '就绪'}</span>
              {result && (
                <span className="text-success">
                  ✓ 仿真完成
                </span>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
