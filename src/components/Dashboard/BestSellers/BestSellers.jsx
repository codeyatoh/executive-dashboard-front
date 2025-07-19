import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import styles from './BestSellers.module.css';
import client from '../../../api/feathers';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const options = {
  indexAxis: 'y',
  responsive: true,
  plugins: {
    legend: { display: false },
    title: {
      display: true,
      text: 'Top 6 Best Sellers',
      align: 'start',
      color: '#232323',
      font: { size: 20, weight: 'bold' },
      padding: { bottom: 20 },
    },
    tooltip: {
      enabled: true,
      callbacks: {
        label: (context) => `${context.parsed.x} sold`, // changed 'sales' to 'sold'
      },
    },
  },
  scales: {
    x: {
      beginAtZero: true,
      grid: { color: '#e0dfdb', borderDash: [4, 4] },
      ticks: {
        color: '#232323',
        font: { size: 15 },
        stepSize: 20,
        callback: function(value, index, ticks) {
          // Hide the '0' label and the last tick label
          if (value === 0) return '';
          if (index === ticks.length - 1) return '';
          return value;
        },
      },
      display: true,
    },
    y: {
      grid: { display: false },
      ticks: {
        color: '#232323',
        font: { size: 13 },
        align: 'start', // align y-axis labels to the left
        padding: 10, // add a bit of left padding
      },
    },
  },
  layout: { padding: { left: 0, right: 20, top: 20, bottom: 20 } },
};

const BestSellers = ({ category = 'Coffee' }) => {
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.service('order_items').find()
      .then(res => {
        // Filter by category (case-insensitive)
        const items = res.data.filter(item => (item.category || '').toLowerCase() === category.toLowerCase());

        // Group by item_name and sum quantity
        const salesMap = {};
        items.forEach(item => {
          if (!salesMap[item.item_name]) {
            salesMap[item.item_name] = 0;
          }
          salesMap[item.item_name] += item.quantity || 0;
        });

        // Sort and get top 6
        const sorted = Object.entries(salesMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6);

        const labels = sorted.map(([name]) => name);
        const data = sorted.map(([, qty]) => qty);

        setChartData({
          labels,
          datasets: [
            {
              label: 'Sales',
              data,
              backgroundColor: '#888784',
              borderRadius: 6,
              barPercentage: 0.7,
              categoryPercentage: 0.7,
              borderSkipped: false,
            },
          ],
        });
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching best sellers:', err);
        setLoading(false);
      });
  }, [category]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className={styles.card}>
      <div className={styles.chartContainer}>
        <Bar data={chartData} options={options} height={320} />
      </div>
    </div>
  );
};

export default BestSellers;
