import styles from './Dashboard.module.css';
import Sidebar from './Sidebar/Sidebar';
import Header from './Header/Header';
import StatsFilter from './StatsFilter/StatsFilter';
import StatsCards from './StatsCards/StatsCards';
import BestSellers from './BestSellers/BestSellers';
import SalesChart from './SalesChart/SalesChart';
import CrewList from './CrewList/CrewList';
import OrderList from './OrderList/OrderList';
import MenuStock from './MenuStock/MenuStock';
import CategoryFilter from './CategoryFilter/CategoryFilter';
import React, { useState } from 'react';

const Dashboard = () => {
  const [category, setCategory] = useState('Coffee');
  const [filter, setFilter] = useState('today');
  const [sidebarOpen, setSidebarOpen] = useState(false); // Add sidebar state

  // Function to toggle sidebar
  const toggleSidebar = () => setSidebarOpen((open) => !open);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className={styles.dashboardRoot}>
      <aside className={styles.sidebarContainer}>
        <Sidebar open={sidebarOpen} onClose={closeSidebar} />
      </aside>
      <main className={styles.mainContainer}>
        <header className={styles.headerContainer}>
          <Header onHamburgerClick={toggleSidebar} />
        </header>
        <div className={styles.contentContainer}>
          <div className={styles.statsFilterContainer}>
            <StatsFilter value={filter} onChange={setFilter} />
          </div>
          <div className={styles.statsCardsContainer}>
            <StatsCards filter={filter} />
          </div>
          <div className={styles.gridContainer}>
            <section className={styles.salesChartContainer}>
              <SalesChart filter={filter} />
            </section>
            <div className={styles.bestSellersColumn}>
              <section className={styles.categoryFilterContainer}>
                <CategoryFilter selected={category} onChange={setCategory} />
              </section>
              <section className={styles.bestSellersContainer}>
                <BestSellers category={category} />
              </section>
            </div>
          </div>
          <div className={styles.bottomRowContainer}>
            <section className={styles.crewListContainer}>
              <CrewList />
            </section>
            <section className={styles.orderListContainer}>
              <OrderList />
            </section>
            <section className={styles.menuStockContainer}>
              <MenuStock />
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;