import React, { useEffect, useState } from 'react';
import styles from './Header.module.css';
import { format } from 'date-fns';

const Header = ({ onHamburgerClick }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = format(now, 'EEEE, dd MMM yyyy');
  const formattedTime = format(now, 'h:mmaaa').toLowerCase();

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {/* Hamburger icon for mobile */}
        <button
          className={styles.hamburger}
          aria-label="Open sidebar menu"
          onClick={onHamburgerClick}
          type="button"
        >
          <span className={styles.hamburgerIcon}>&#9776;</span>
        </button>
        <span className={styles.weatherIcon}>☁️</span>
        <div>
          <div className={styles.date}>{formattedDate}</div>
          <div className={styles.time}>{formattedTime}</div>
        </div>
      </div>
      <div className={styles.dashboardTitle}>Executive Dashboard</div>
    </header>
  );
};

export default Header;