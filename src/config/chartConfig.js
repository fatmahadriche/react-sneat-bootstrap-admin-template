  import { Chart as ChartJS } from 'chart.js/auto';

  export const configureCharts = () => {
    // Configuration globale des graphiques
    ChartJS.defaults.font.family = 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
    ChartJS.defaults.font.size = 12;
    ChartJS.defaults.color = '#4a5568'; // Couleur plus contrastée
    ChartJS.defaults.borderColor = 'rgba(0, 0, 0, 0.1)';
    
    // Configuration des légendes
    ChartJS.defaults.plugins.legend.position = 'top';
    ChartJS.defaults.plugins.legend.align = 'center';
    ChartJS.defaults.plugins.legend.labels.padding = 20;
    ChartJS.defaults.plugins.legend.labels.usePointStyle = true;
    ChartJS.defaults.plugins.legend.labels.font = {
      size: 13,
      weight: 'bold'
    };
    
    // Configuration des tooltips
    ChartJS.defaults.plugins.tooltip.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    ChartJS.defaults.plugins.tooltip.cornerRadius = 6;
    ChartJS.defaults.plugins.tooltip.padding = 12;
    ChartJS.defaults.plugins.tooltip.titleFont = {
      size: 14,
      weight: 'bold'
    };
    ChartJS.defaults.plugins.tooltip.bodyFont = {
      size: 13
    };
    
    // Configuration des animations pour une meilleure expérience
    ChartJS.defaults.animation.duration = 1000;
    ChartJS.defaults.animation.easing = 'easeInOutQuart';
    
    // Configuration responsive
    ChartJS.defaults.responsive = true;
    ChartJS.defaults.maintainAspectRatio = false;
    
    // Configuration des interactions
    ChartJS.defaults.interaction = {
      intersect: false,
      mode: 'index'
    };
  };