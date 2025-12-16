import OFDMSimulator from './pages/OFDMSimulator';
import type { ReactNode } from 'react';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: 'OFDM通信系统演示',
    path: '/',
    element: <OFDMSimulator />
  }
];

export default routes;
