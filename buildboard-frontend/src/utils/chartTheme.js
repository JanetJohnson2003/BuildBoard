// Recharts theme for CyberBoard
export const cyberChartTheme = {
  colors: ['#00d4ff', '#a855f7', '#06ffc7', '#ff3e9a', '#ff6b35'],
  grid: {
    stroke: 'rgba(255, 255, 255, 0.05)',
    strokeDasharray: '3 3'
  },
  axis: {
    stroke: 'rgba(255, 255, 255, 0.2)',
    tick: { fill: '#71717a', fontSize: 12, fontFamily: 'Inter, sans-serif' }
  },
  tooltip: {
    contentStyle: {
      backgroundColor: 'rgba(18, 18, 26, 0.8)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(0, 212, 255, 0.3)',
      borderRadius: '8px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), 0 0 10px rgba(0, 212, 255, 0.2)',
      color: '#e4e4e7',
      fontFamily: 'Inter, sans-serif'
    },
    itemStyle: {
      color: '#00d4ff'
    }
  }
};
