/**
 * OFDM系统类型定义
 */

import type { Complex } from '@/utils/ofdm';

// OFDM系统参数
export interface OFDMParameters {
  numSubcarriers: number; // 子载波数量
  modulationType: 'QPSK' | '16QAM' | '64QAM'; // 调制方式
  pilotSpacing: number; // 导频间隔
  pilotPower: number; // 导频功率
  snrDB: number; // 信噪比（dB）
  channelType: 'awgn' | 'multipath'; // 信道类型
}

// 多径信道参数
export interface MultipathParameters {
  path1Delay: number; // 路径1时延
  path1Gain: number; // 路径1增益
  path1Phase: number; // 路径1相位
  path2Delay: number; // 路径2时延
  path2Gain: number; // 路径2增益
  path2Phase: number; // 路径2相位
  path3Delay: number; // 路径3时延
  path3Gain: number; // 路径3增益
  path3Phase: number; // 路径3相位
}

// 仿真结果
export interface SimulationResult {
  transmittedBits: number[]; // 发送比特
  receivedBits: number[]; // 接收比特
  transmittedSymbols: Complex[]; // 发送符号（星座图）
  receivedSymbols: Complex[]; // 接收符号（星座图）
  equalizedSymbols: Complex[]; // 均衡后符号
  timeSignal: Complex[]; // 时域信号
  freqSignal: Complex[]; // 频域信号
  channelResponse: Complex[]; // 信道频率响应
  channelEstimate: Complex[]; // 信道估计
  ber: number; // 误码率
}

// 图表数据点
export interface ChartDataPoint {
  x: number;
  y: number;
  label?: string;
}

// 复数图表数据点
export interface ComplexChartDataPoint {
  real: number;
  imag: number;
  label?: string;
}
