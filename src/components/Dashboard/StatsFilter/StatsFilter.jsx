import styles from './StatsFilter.module.css';

const StatsFilter = ({ value, onChange }) => {
  return (
    <div className={styles.filterContainer}>
      <span className={styles.filterLabel}>Filter by Date:</span>
      <div className={styles.buttonGroup}>
        <button
          className={`${styles.filterButton} ${value === 'today' ? styles.active : ''}`}
          onClick={() => onChange('today')}
        >
          Today
        </button>
        <button
          className={`${styles.filterButton} ${value === 'week' ? styles.active : ''}`}
          onClick={() => onChange('week')}
        >
          This Week
        </button>
        <button
          className={`${styles.filterButton} ${value === 'month' ? styles.active : ''}`}
          onClick={() => onChange('month')}
        >
          This Month
        </button>
      </div>
    </div>
  );
};

export default StatsFilter;
