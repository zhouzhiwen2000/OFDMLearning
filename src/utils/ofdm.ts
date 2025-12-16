/**
 * OFDM通信系统核心算法模块
 */

// 复数类
export class Complex {
  constructor(public real: number, public imag: number) {}

  // 复数加法
  add(other: Complex): Complex {
    return new Complex(this.real + other.real, this.imag + other.imag);
  }

  // 复数减法
  subtract(other: Complex): Complex {
    return new Complex(this.real - other.real, this.imag - other.imag);
  }

  // 复数乘法
  multiply(other: Complex): Complex {
    return new Complex(
      this.real * other.real - this.imag * other.imag,
      this.real * other.imag + this.imag * other.real
    );
  }

  // 复数除法
  divide(other: Complex): Complex {
    const denominator = other.real * other.real + other.imag * other.imag;
    return new Complex(
      (this.real * other.real + this.imag * other.imag) / denominator,
      (this.imag * other.real - this.real * other.imag) / denominator
    );
  }

  // 复数模
  magnitude(): number {
    return Math.sqrt(this.real * this.real + this.imag * this.imag);
  }

  // 复数相位
  phase(): number {
    return Math.atan2(this.imag, this.real);
  }

  // 复数共轭
  conjugate(): Complex {
    return new Complex(this.real, -this.imag);
  }
}

// QAM调制类型
export type ModulationType = 'QPSK' | '16QAM' | '64QAM';

// QAM调制器
export class QAMModulator {
  private constellation: Complex[] = [];

  constructor(private modulationType: ModulationType) {
    this.generateConstellation();
  }

  // 生成星座图
  private generateConstellation(): void {
    switch (this.modulationType) {
      case 'QPSK':
        this.constellation = this.generateQPSK();
        break;
      case '16QAM':
        this.constellation = this.generate16QAM();
        break;
      case '64QAM':
        this.constellation = this.generate64QAM();
        break;
    }
  }

  private generateQPSK(): Complex[] {
    const scale = 1 / Math.sqrt(2);
    return [
      new Complex(scale, scale),
      new Complex(-scale, scale),
      new Complex(-scale, -scale),
      new Complex(scale, -scale),
    ];
  }

  private generate16QAM(): Complex[] {
    const constellation: Complex[] = [];
    const scale = 1 / Math.sqrt(10);
    for (let i = -3; i <= 3; i += 2) {
      for (let q = -3; q <= 3; q += 2) {
        constellation.push(new Complex(i * scale, q * scale));
      }
    }
    return constellation;
  }

  private generate64QAM(): Complex[] {
    const constellation: Complex[] = [];
    const scale = 1 / Math.sqrt(42);
    for (let i = -7; i <= 7; i += 2) {
      for (let q = -7; q <= 7; q += 2) {
        constellation.push(new Complex(i * scale, q * scale));
      }
    }
    return constellation;
  }

  // 调制比特流
  modulate(bits: number[]): Complex[] {
    const bitsPerSymbol = Math.log2(this.constellation.length);
    const symbols: Complex[] = [];

    for (let i = 0; i < bits.length; i += bitsPerSymbol) {
      let index = 0;
      for (let j = 0; j < bitsPerSymbol && i + j < bits.length; j++) {
        index = (index << 1) | bits[i + j];
      }
      symbols.push(this.constellation[index % this.constellation.length]);
    }

    return symbols;
  }

  // 解调符号
  demodulate(symbols: Complex[]): number[] {
    const bitsPerSymbol = Math.log2(this.constellation.length);
    const bits: number[] = [];

    for (const symbol of symbols) {
      // 找到最近的星座点
      let minDistance = Number.MAX_VALUE;
      let closestIndex = 0;

      for (let i = 0; i < this.constellation.length; i++) {
        const distance = symbol.subtract(this.constellation[i]).magnitude();
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = i;
        }
      }

      // 将索引转换为比特
      for (let j = bitsPerSymbol - 1; j >= 0; j--) {
        bits.push((closestIndex >> j) & 1);
      }
    }

    return bits;
  }

  getConstellation(): Complex[] {
    return this.constellation;
  }
}

// FFT/IFFT实现
export class FFT {
  // 快速傅里叶变换
  static fft(input: Complex[]): Complex[] {
    const n = input.length;
    if (n <= 1) return input;

    // 确保长度为2的幂
    if ((n & (n - 1)) !== 0) {
      throw new Error('FFT length must be a power of 2');
    }

    // 分治法
    const even = FFT.fft(input.filter((_, i) => i % 2 === 0));
    const odd = FFT.fft(input.filter((_, i) => i % 2 === 1));

    const result: Complex[] = new Array(n);
    for (let k = 0; k < n / 2; k++) {
      const angle = (-2 * Math.PI * k) / n;
      const twiddle = new Complex(Math.cos(angle), Math.sin(angle));
      const t = twiddle.multiply(odd[k]);

      result[k] = even[k].add(t);
      result[k + n / 2] = even[k].subtract(t);
    }

    return result;
  }

  // 逆快速傅里叶变换
  static ifft(input: Complex[]): Complex[] {
    const n = input.length;
    // 对输入取共轭
    const conjugated = input.map(c => c.conjugate());
    // 执行FFT
    const fftResult = FFT.fft(conjugated);
    // 对结果取共轭并归一化
    return fftResult.map(c => new Complex(c.real / n, -c.imag / n));
  }
}

// 导频配置
export interface PilotConfig {
  spacing: number; // 导频间隔
  power: number; // 导频功率
}

// OFDM符号生成器
export class OFDMSymbolGenerator {
  constructor(
    private numSubcarriers: number,
    private pilotConfig: PilotConfig
  ) {}

  // 插入导频
  insertPilots(dataSymbols: Complex[]): Complex[] {
    const ofdmSymbol: Complex[] = new Array(this.numSubcarriers).fill(
      new Complex(0, 0)
    );
    const { spacing, power } = this.pilotConfig;

    let dataIndex = 0;
    for (let i = 0; i < this.numSubcarriers; i++) {
      if (i % spacing === 0) {
        // 导频位置
        ofdmSymbol[i] = new Complex(power, 0);
      } else {
        // 数据位置
        if (dataIndex < dataSymbols.length) {
          ofdmSymbol[i] = dataSymbols[dataIndex++];
        }
      }
    }

    return ofdmSymbol;
  }

  // 提取导频
  extractPilots(ofdmSymbol: Complex[]): { pilots: Complex[]; pilotIndices: number[] } {
    const pilots: Complex[] = [];
    const pilotIndices: number[] = [];
    const { spacing } = this.pilotConfig;

    for (let i = 0; i < ofdmSymbol.length; i++) {
      if (i % spacing === 0) {
        pilots.push(ofdmSymbol[i]);
        pilotIndices.push(i);
      }
    }

    return { pilots, pilotIndices };
  }

  // 提取数据
  extractData(ofdmSymbol: Complex[]): Complex[] {
    const data: Complex[] = [];
    const { spacing } = this.pilotConfig;

    for (let i = 0; i < ofdmSymbol.length; i++) {
      if (i % spacing !== 0) {
        data.push(ofdmSymbol[i]);
      }
    }

    return data;
  }
}

// 多径信道参数
export interface MultipathChannel {
  delays: number[]; // 时延（采样点）
  gains: number[]; // 增益
  phases: number[]; // 相位（弧度）
}

// 信道模拟器
export class ChannelSimulator {
  constructor(private channel: MultipathChannel) {}

  // 应用信道效应
  applyChannel(signal: Complex[]): Complex[] {
    const output: Complex[] = new Array(signal.length).fill(new Complex(0, 0));

    for (let i = 0; i < this.channel.delays.length; i++) {
      const delay = Math.round(this.channel.delays[i]);
      const gain = this.channel.gains[i];
      const phase = this.channel.phases[i];
      const channelCoeff = new Complex(
        gain * Math.cos(phase),
        gain * Math.sin(phase)
      );

      for (let j = 0; j < signal.length; j++) {
        const outputIndex = j + delay;
        if (outputIndex < output.length) {
          output[outputIndex] = output[outputIndex].add(
            signal[j].multiply(channelCoeff)
          );
        }
      }
    }

    return output;
  }

  // 获取信道频率响应
  getFrequencyResponse(numPoints: number): Complex[] {
    const response: Complex[] = [];

    for (let k = 0; k < numPoints; k++) {
      let sum = new Complex(0, 0);
      for (let i = 0; i < this.channel.delays.length; i++) {
        const angle =
          (-2 * Math.PI * k * this.channel.delays[i]) / numPoints +
          this.channel.phases[i];
        const coeff = new Complex(
          this.channel.gains[i] * Math.cos(angle),
          this.channel.gains[i] * Math.sin(angle)
        );
        sum = sum.add(coeff);
      }
      response.push(sum);
    }

    return response;
  }
}

// 添加高斯白噪声
export function addAWGN(signal: Complex[], snrDB: number): Complex[] {
  // 计算信号功率
  let signalPower = 0;
  for (const s of signal) {
    signalPower += s.magnitude() ** 2;
  }
  signalPower /= signal.length;

  // 计算噪声功率
  const snrLinear = 10 ** (snrDB / 10);
  const noisePower = signalPower / snrLinear;
  const noiseStd = Math.sqrt(noisePower / 2);

  // 添加噪声
  return signal.map(s => {
    const noiseReal = noiseStd * randomGaussian();
    const noiseImag = noiseStd * randomGaussian();
    return new Complex(s.real + noiseReal, s.imag + noiseImag);
  });
}

// 生成高斯随机数（Box-Muller变换）
function randomGaussian(): number {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// 信道估计器
export class ChannelEstimator {
  // 基于导频的最小二乘信道估计（直角坐标线性插值）
  static leastSquaresLinear(
    receivedPilots: Complex[],
    pilotIndices: number[],
    pilotPower: number,
    numSubcarriers: number
  ): Complex[] {
    // 在导频位置估计信道
    const channelAtPilots: Complex[] = receivedPilots.map(
      pilot => new Complex(pilot.real / pilotPower, pilot.imag / pilotPower)
    );

    // 线性插值到所有子载波（直角坐标系）
    const channelEstimate: Complex[] = new Array(numSubcarriers);

    for (let i = 0; i < numSubcarriers; i++) {
      // 找到最近的两个导频
      let leftIdx = 0;
      let rightIdx = pilotIndices.length - 1;

      for (let j = 0; j < pilotIndices.length - 1; j++) {
        if (pilotIndices[j] <= i && pilotIndices[j + 1] > i) {
          leftIdx = j;
          rightIdx = j + 1;
          break;
        }
      }

      if (i <= pilotIndices[0]) {
        channelEstimate[i] = channelAtPilots[0];
      } else if (i >= pilotIndices[pilotIndices.length - 1]) {
        channelEstimate[i] = channelAtPilots[channelAtPilots.length - 1];
      } else {
        // 线性插值（直角坐标系）
        const x1 = pilotIndices[leftIdx];
        const x2 = pilotIndices[rightIdx];
        const y1 = channelAtPilots[leftIdx];
        const y2 = channelAtPilots[rightIdx];

        const weight = (i - x1) / (x2 - x1);
        channelEstimate[i] = new Complex(
          y1.real + weight * (y2.real - y1.real),
          y1.imag + weight * (y2.imag - y1.imag)
        );
      }
    }

    return channelEstimate;
  }

  // 基于导频的最小二乘信道估计（极坐标线性插值）
  static leastSquaresPolar(
    receivedPilots: Complex[],
    pilotIndices: number[],
    pilotPower: number,
    numSubcarriers: number
  ): Complex[] {
    // 在导频位置估计信道
    const channelAtPilots: Complex[] = receivedPilots.map(
      pilot => new Complex(pilot.real / pilotPower, pilot.imag / pilotPower)
    );

    // 转换为极坐标
    const magnitudes = channelAtPilots.map(c => c.magnitude());
    const phases = channelAtPilots.map(c => c.phase());

    // 线性插值到所有子载波（极坐标系）
    const channelEstimate: Complex[] = new Array(numSubcarriers);

    for (let i = 0; i < numSubcarriers; i++) {
      // 找到最近的两个导频
      let leftIdx = 0;
      let rightIdx = pilotIndices.length - 1;

      for (let j = 0; j < pilotIndices.length - 1; j++) {
        if (pilotIndices[j] <= i && pilotIndices[j + 1] > i) {
          leftIdx = j;
          rightIdx = j + 1;
          break;
        }
      }

      let magnitude: number;
      let phase: number;

      if (i <= pilotIndices[0]) {
        magnitude = magnitudes[0];
        phase = phases[0];
      } else if (i >= pilotIndices[pilotIndices.length - 1]) {
        magnitude = magnitudes[magnitudes.length - 1];
        phase = phases[phases.length - 1];
      } else {
        // 线性插值（极坐标系）
        const x1 = pilotIndices[leftIdx];
        const x2 = pilotIndices[rightIdx];
        const mag1 = magnitudes[leftIdx];
        const mag2 = magnitudes[rightIdx];
        const phase1 = phases[leftIdx];
        const phase2 = phases[rightIdx];

        const weight = (i - x1) / (x2 - x1);
        
        // 幅度线性插值
        magnitude = mag1 + weight * (mag2 - mag1);
        
        // 相位线性插值（处理相位跳变）
        let phaseDiff = phase2 - phase1;
        // 将相位差归一化到[-π, π]
        while (phaseDiff > Math.PI) phaseDiff -= 2 * Math.PI;
        while (phaseDiff < -Math.PI) phaseDiff += 2 * Math.PI;
        phase = phase1 + weight * phaseDiff;
      }

      // 转换回直角坐标
      channelEstimate[i] = new Complex(
        magnitude * Math.cos(phase),
        magnitude * Math.sin(phase)
      );
    }

    return channelEstimate;
  }

  // 基于导频的最小二乘信道估计（DFT插值）
  static leastSquaresDFT(
    receivedPilots: Complex[],
    pilotIndices: number[],
    pilotPower: number,
    numSubcarriers: number,
    threshold: number
  ): Complex[] {
    // 在导频位置估计信道
    const channelAtPilots: Complex[] = receivedPilots.map(
      pilot => new Complex(pilot.real / pilotPower, pilot.imag / pilotPower)
    );

    // 首先使用线性插值得到所有子载波的初始估计
    const channelEstimate: Complex[] = new Array(numSubcarriers);

    for (let i = 0; i < numSubcarriers; i++) {
      // 找到最近的两个导频
      let leftIdx = 0;
      let rightIdx = pilotIndices.length - 1;

      for (let j = 0; j < pilotIndices.length - 1; j++) {
        if (pilotIndices[j] <= i && pilotIndices[j + 1] > i) {
          leftIdx = j;
          rightIdx = j + 1;
          break;
        }
      }

      if (i <= pilotIndices[0]) {
        channelEstimate[i] = channelAtPilots[0];
      } else if (i >= pilotIndices[pilotIndices.length - 1]) {
        channelEstimate[i] = channelAtPilots[channelAtPilots.length - 1];
      } else {
        // 线性插值
        const x1 = pilotIndices[leftIdx];
        const x2 = pilotIndices[rightIdx];
        const y1 = channelAtPilots[leftIdx];
        const y2 = channelAtPilots[rightIdx];

        const weight = (i - x1) / (x2 - x1);
        channelEstimate[i] = new Complex(
          y1.real + weight * (y2.real - y1.real),
          y1.imag + weight * (y2.imag - y1.imag)
        );
      }
    }

    // DFT插值：IFFT到时延域，阈值处理，FFT回频域
    // 1. IFFT到时延域
    const timeResponse = FFT.ifft(channelEstimate);

    // 2. 将高于阈值的时延分量置零
    for (let i = threshold; i < timeResponse.length; i++) {
      timeResponse[i] = new Complex(0, 0);
    }

    // 3. FFT回频域
    const filteredChannel = FFT.fft(timeResponse);

    return filteredChannel;
  }

  // 统一接口
  static estimate(
    receivedPilots: Complex[],
    pilotIndices: number[],
    pilotPower: number,
    numSubcarriers: number,
    interpolationType: 'linear' | 'polar' | 'dft' = 'linear',
    dftThreshold?: number
  ): Complex[] {
    if (interpolationType === 'polar') {
      return ChannelEstimator.leastSquaresPolar(
        receivedPilots,
        pilotIndices,
        pilotPower,
        numSubcarriers
      );
    } else if (interpolationType === 'dft') {
      const threshold = dftThreshold ?? Math.floor(numSubcarriers / 4);
      return ChannelEstimator.leastSquaresDFT(
        receivedPilots,
        pilotIndices,
        pilotPower,
        numSubcarriers,
        threshold
      );
    } else {
      return ChannelEstimator.leastSquaresLinear(
        receivedPilots,
        pilotIndices,
        pilotPower,
        numSubcarriers
      );
    }
  }
}

// 信道均衡器
export class ChannelEqualizer {
  // 零强迫均衡
  static zeroForcing(receivedSymbols: Complex[], channelEstimate: Complex[]): Complex[] {
    return receivedSymbols.map((symbol, i) => {
      const h = channelEstimate[i];
      // 避免除以零
      if (h.magnitude() < 1e-10) {
        return new Complex(0, 0);
      }
      return symbol.divide(h);
    });
  }

  // MMSE均衡
  static mmse(
    receivedSymbols: Complex[],
    channelEstimate: Complex[],
    snrLinear: number
  ): Complex[] {
    return receivedSymbols.map((symbol, i) => {
      const h = channelEstimate[i];
      const hMagSq = h.real * h.real + h.imag * h.imag;
      const denominator = hMagSq + 1 / snrLinear;

      const hConj = h.conjugate();
      const numerator = symbol.multiply(hConj);

      return new Complex(numerator.real / denominator, numerator.imag / denominator);
    });
  }
}

// 计算误码率
export function calculateBER(transmittedBits: number[], receivedBits: number[]): number {
  let errors = 0;
  const length = Math.min(transmittedBits.length, receivedBits.length);

  for (let i = 0; i < length; i++) {
    if (transmittedBits[i] !== receivedBits[i]) {
      errors++;
    }
  }

  return length > 0 ? errors / length : 0;
}

// 生成随机比特流
export function generateRandomBits(length: number): number[] {
  return Array.from({ length }, () => (Math.random() > 0.5 ? 1 : 0));
}

// 添加循环前缀
export function addCyclicPrefix(signal: Complex[], cpLength: number): Complex[] {
  if (cpLength <= 0 || cpLength >= signal.length) {
    return signal;
  }
  
  // 取信号末尾cpLength个样本，添加到信号前面
  const cp = signal.slice(signal.length - cpLength);
  return [...cp, ...signal];
}

// 移除循环前缀
export function removeCyclicPrefix(signal: Complex[], cpLength: number): Complex[] {
  if (cpLength <= 0 || cpLength >= signal.length) {
    return signal;
  }
  
  // 移除前cpLength个样本
  return signal.slice(cpLength);
}

// 生成随机多径信道参数
export function generateRandomMultipathChannel(
  delaySpread: number,
  numPaths: number = 3
): MultipathChannel {
  const delays: number[] = [];
  const gains: number[] = [];
  const phases: number[] = [];

  // 第一条路径（直射路径）
  delays.push(0);
  gains.push(1.0);
  phases.push(0);

  // 生成其他路径
  for (let i = 1; i < numPaths; i++) {
    // 时延在[0, delaySpread]范围内均匀分布
    const delay = Math.random() * delaySpread;
    delays.push(delay);

    // 增益随时延指数衰减，并添加随机扰动
    const baseGain = Math.exp(-delay / (delaySpread / 2));
    const randomFactor = 0.5 + Math.random() * 0.5; // [0.5, 1.0]
    gains.push(baseGain * randomFactor);

    // 相位在[0, 2π]范围内均匀分布
    phases.push(Math.random() * 2 * Math.PI);
  }

  // 归一化增益，使总功率为1
  const totalPower = gains.reduce((sum, g) => sum + g * g, 0);
  const normFactor = Math.sqrt(totalPower);
  const normalizedGains = gains.map(g => g / normFactor);

  return {
    delays,
    gains: normalizedGains,
    phases,
  };
}
