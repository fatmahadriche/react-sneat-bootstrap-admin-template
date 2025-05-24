import { Chart } from 'chart.js';

export const configureCharts = () => {
  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.color = '#697a8d';
  Chart.defaults.borderColor = 'rgba(105, 122, 141, 0.1)';
};