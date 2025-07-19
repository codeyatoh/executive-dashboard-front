import React, { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import styles from './MenuStock.module.css';
import client from '../../../api/feathers';

ChartJS.register(ArcElement, Tooltip, Legend);

const options = {
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context) => `${context.label}: ${context.parsed}%`,
      },
    },
  },
};

const MenuStock = () => {
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [legendData, setLegendData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.service('order_items').find()
      .then(res => {
        // Group by category and sum quantity
        const stockMap = {};
        res.data.forEach(item => {
          const cat = (item.category || '').toLowerCase();
          if (!stockMap[cat]) stockMap[cat] = 0;
          stockMap[cat] += item.quantity || 0;
        });

        const labels = Object.keys(stockMap).map(cat =>
          cat.charAt(0).toUpperCase() + cat.slice(1)
        );
        const data = Object.values(stockMap);

        // Calculate percentage per category
        const total = data.reduce((sum, val) => sum + val, 0);
        const percentages = data.map(val => total ? Math.round((val / total) * 100) : 0);

        // For legend
        const colors = ['#232323', '#bdbdbd', '#888784', '#e0dfdb'];
        const legendArr = labels.map((label, i) => ({
          label,
          value: percentages[i],
          color: colors[i % colors.length],
        }));

        setChartData({
          labels,
          datasets: [
            {
              data: percentages,
              backgroundColor: colors.slice(0, labels.length),
              borderWidth: 0,
            },
          ],
        });
        setLegendData(legendArr);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching menu stock:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className={styles.card}>
      <div className={styles.title}>Menu Stock</div>
      <div className={styles.pieWrapper}>
        <div className={styles.legend}>
          {legendData.map((item) => (
            <div className={styles.legendRow} key={item.label}>
              <span
                className={styles.legendColor}
                style={{ background: item.color }}
              ></span>
              <span>{item.value}% {item.label}</span>
            </div>
          ))}
        </div>
        <div className={styles.pieChart}>
          <Pie data={chartData} options={options} />
        </div>
      </div>
    </div>
  );
};

export default MenuStock;
