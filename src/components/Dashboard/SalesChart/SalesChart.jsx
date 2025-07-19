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
import styles from './SalesChart.module.css';
import client from '../../../api/feathers';
import ExportReport from '../../Modals/ExportReport/ExportReport';
import { FiDownload } from 'react-icons/fi';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const HOURS = [
  '8AM', '9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM'
];

const options = {
  responsive: true,
  maintainAspectRatio: true, // let chart fill container naturally
  plugins: {
    legend: {
      display: false, // Disable built-in legend
    },
    title: {
      display: false,
    },
    tooltip: {
      enabled: true,
      callbacks: {
        label: (context) => `₱${context.parsed.y.toLocaleString()}`,
      },
    },
  },
  layout: { padding: { top: 0, right: 8, bottom: 0, left: 8 } }, // minimal padding
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        color: '#232323',
        font: { size: 14, weight: 'bold', family: 'Inter, system-ui, sans-serif' },
        maxRotation: 0,
        minRotation: 0,
        padding: 10,
      },
      categoryPercentage: 0.75,
      barPercentage: 0.75,
    },
    y: {
      beginAtZero: true,
      ticks: {
        color: '#232323',
        font: { size: 13, weight: 'bold', family: 'Inter, system-ui, sans-serif' },
        callback: (value) => `₱${value.toLocaleString()}`,
        stepSize: 500,
        padding: 18,
      },
      grid: { color: '#e0e0e0', borderDash: [2, 2] },
    },
  },
  elements: {
    bar: {
      borderRadius: 6,
    },
  },
};

const getLocalDateString = (date) => {
  // Returns YYYY-MM-DD in local time
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getWeekDays = (date) => {
  // Returns array of local date strings for each day in the current week (Sun-Sat)
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return getLocalDateString(d);
  });
};

const getMonthDays = (date) => {
  // Returns array of local date strings for each day in the current month
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month, i + 1);
    return getLocalDateString(d);
  });
};

const SalesChart = ({ filter = 'today' }) => {
  const [chartData, setChartData] = useState({ labels: HOURS, datasets: [] });
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState({ current: true, compare: true });
  const [exportOpen, setExportOpen] = useState(false);
  // Add state for orders, orderItems, crew
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [crew, setCrew] = useState([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      client.service('orders').find(),
      client.service('order_items').find(),
      client.service('crew').find()
    ]).then(([ordersRes, orderItemsRes, crewRes]) => {
      const orders = ordersRes.data;
      const orderItems = orderItemsRes.data;
      const crew = crewRes.data;
      setOrders(orders);
      setOrderItems(orderItems);
      setCrew(crew);
      let labels = HOURS;
      let currentSales = {};
      let compareSales = {};
      let compareLabel = '';
      let currentLabel = '';
      let compareDates = [];
      let currentDates = [];

      if (filter === 'today') {
        // Today vs Yesterday (hourly)
        const todayStr = getLocalDateString(now);
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const yesterdayStr = getLocalDateString(yesterday);
        labels = HOURS;
        currentLabel = 'Today';
        compareLabel = 'Yesterday';
        HOURS.forEach(h => { currentSales[h] = 0; compareSales[h] = 0; });
        orders.forEach(order => {
          if (!order.created_at) return;
          const orderDate = new Date(order.created_at);
          const dateStr = getLocalDateString(orderDate);
          let hour = orderDate.getHours();
          if (hour < 8 || hour > 17) return;
          let label = hour === 12 ? '12PM' : hour > 12 ? `${hour - 12}PM` : `${hour}AM`;
          if (!HOURS.includes(label)) return;
          const total = orderItems
            .filter(item => item.order_id === order.order_id)
            .reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
          if (dateStr === todayStr) {
            currentSales[label] += total;
          } else if (dateStr === yesterdayStr) {
            compareSales[label] += total;
          }
        });
      } else if (filter === 'week') {
        // This week vs Last week (daily)
        const weekDays = getWeekDays(now); // Sun-Sat this week (local)
        const lastWeekStart = new Date(weekDays[0]);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        const lastWeekDays = getWeekDays(lastWeekStart);
        labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        currentLabel = 'This Week';
        compareLabel = 'Last Week';
        weekDays.forEach((d, i) => { currentSales[labels[i]] = 0; });
        lastWeekDays.forEach((d, i) => { compareSales[labels[i]] = 0; });
        orders.forEach(order => {
          if (!order.created_at) return;
          const orderDate = new Date(order.created_at);
          const dateStr = getLocalDateString(orderDate);
          const dayIdx = weekDays.indexOf(dateStr);
          const lastIdx = lastWeekDays.indexOf(dateStr);
          const total = orderItems
            .filter(item => item.order_id === order.order_id)
            .reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
          if (dayIdx !== -1) {
            currentSales[labels[dayIdx]] += total;
          } else if (lastIdx !== -1) {
            compareSales[labels[lastIdx]] += total;
          }
        });
      } else if (filter === 'month') {
        // This month vs Last month (daily)
        const year = now.getFullYear();
        const month = now.getMonth();
        const monthDays = getMonthDays(now);
        const lastMonthDate = new Date(year, month - 1, 1);
        const lastMonthDays = getMonthDays(lastMonthDate);
        labels = monthDays.map(d => new Date(d).getDate().toString());
        currentLabel = 'This Month';
        compareLabel = 'Last Month';
        monthDays.forEach((d, i) => { currentSales[labels[i]] = 0; });
        lastMonthDays.forEach((d, i) => { compareSales[(i + 1).toString()] = 0; });
        orders.forEach(order => {
          if (!order.created_at) return;
          const orderDate = new Date(order.created_at);
          const dateStr = getLocalDateString(orderDate);
          const thisMonthIdx = monthDays.indexOf(dateStr);
          const lastMonthIdx = lastMonthDays.indexOf(dateStr);
          const total = orderItems
            .filter(item => item.order_id === order.order_id)
            .reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
          if (thisMonthIdx !== -1) {
            currentSales[(thisMonthIdx + 1).toString()] += total;
          } else if (lastMonthIdx !== -1) {
            compareSales[(lastMonthIdx + 1).toString()] += total;
          }
        });
      }

      const datasets = [];
      if (visible.current) {
        datasets.push({
          label: currentLabel,
          data: labels.map(label => currentSales[label] || 0),
          backgroundColor: '#bdbdbd',
          borderRadius: 6,
          barPercentage: 0.75,
          categoryPercentage: 0.75,
        });
      }
      if (visible.compare) {
        datasets.push({
          label: compareLabel,
          data: labels.map(label => compareSales[label] || 0),
          backgroundColor: '#23232b',
          borderRadius: 6,
          barPercentage: 0.75,
          categoryPercentage: 0.75,
        });
      }

      setChartData({
        labels,
        datasets,
      });
      setLoading(false);
    }).catch(err => {
      console.error('Error fetching sales data:', err);
      setLoading(false);
    });
  }, [filter, visible]);

  const handleLegendClick = (key) => {
    setVisible(v => ({ ...v, [key]: !v[key] }));
  };

  if (loading) return <div>Loading...</div>;

  // Legend labels based on filter
  const legendLabels = filter === 'today'
    ? { current: 'Today', compare: 'Yesterday' }
    : filter === 'week'
      ? { current: 'This Week', compare: 'Last Week' }
      : { current: 'This Month', compare: 'Last Month' };

  return (
    <div className={styles.chartContainer}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div className={styles.chartTitle}>Sales Report</div>
        <button
          className={styles.exportReportBtn}
          onClick={() => setExportOpen(true)}
        >
          <FiDownload style={{ marginRight: 7, fontSize: '1.2em' }} />
          Export the report
        </button>
      </div>
      <div className={styles.customLegendContainer}>
        <span
          className={styles.legendItem + ' ' + (!visible.current ? styles.legendInactive : '')}
          onClick={() => handleLegendClick('current')}
          style={{ cursor: 'pointer' }}
        >
          <span className={styles.legendBox} style={{ background: '#bdbdbd', opacity: visible.current ? 1 : 0.3 }}></span>
          {legendLabels.current}
        </span>
        <span
          className={styles.legendItem + ' ' + (!visible.compare ? styles.legendInactive : '')}
          onClick={() => handleLegendClick('compare')}
          style={{ cursor: 'pointer' }}
        >
          <span className={styles.legendBox} style={{ background: '#23232b', opacity: visible.compare ? 1 : 0.3 }}></span>
          {legendLabels.compare}
        </span>
      </div>
      <div className={styles.chartArea}>
        <Bar options={options} data={chartData} />
      </div>
      <ExportReport 
        open={exportOpen} 
        onClose={() => setExportOpen(false)} 
        chartData={chartData} 
        orders={orders}
        orderItems={orderItems}
        crew={crew}
        filter={filter}
      />
    </div>
  );
};

export default SalesChart;
