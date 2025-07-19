import React, { useEffect, useState } from 'react';
import styles from './CrewList.module.css';
import client from '../../../api/feathers';

const CREW_PER_PAGE = 5;

const CrewList = () => {
  const [crew, setCrew] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    // Fetch both crews and orders in parallel
    Promise.all([
      client.service('crew').find(),
      client.service('orders').find()
    ])
      .then(([crewRes, ordersRes]) => {
        const crews = crewRes.data;
        const orders = ordersRes.data;
        // Filter completed orders
        const completedOrders = orders.filter(o => o.order_status === 'Completed');
        // Count completed orders per crew_id
        const soldMap = {};
        completedOrders.forEach(order => {
          if (!soldMap[order.crew_id]) soldMap[order.crew_id] = 0;
          soldMap[order.crew_id] += 1;
        });
        // Attach sold count to each crew
        const crewWithSold = crews.map(c => ({
          ...c,
          sales: soldMap[c.crew_id] || 0
        }));
        // Sort by sales descending
        crewWithSold.sort((a, b) => b.sales - a.sales);
        setCrew(crewWithSold);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching crew or orders:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  // Pagination logic
  const totalPages = Math.ceil(crew.length / CREW_PER_PAGE);
  const paginatedCrew = crew.slice(
    (currentPage - 1) * CREW_PER_PAGE,
    currentPage * CREW_PER_PAGE
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className={styles.card}>
      <div className={styles.title}>Top Crew Based on Sales</div>
      <div className={styles.list}>
        {paginatedCrew.map((c, idx) => (
          <div className={styles.row} key={c.crew_id}>
            <span className={styles.id}>{String((currentPage - 1) * CREW_PER_PAGE + idx + 1).padStart(3, '0')}.</span>
            <span className={styles.name}>{c.first_name} {c.last_name}</span>
            <span className={styles.sales}>Sold: <b>{c.sales}</b></span>
          </div>
        ))}
      </div>
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              className={styles.row}
              style={{
                margin: '0 0.25rem',
                backgroundColor: currentPage === i + 1 ? '#222' : '',
                color: currentPage === i + 1 ? '#fff' : '',
                border: currentPage === i + 1 ? '2px solid #222' : ''
              }}
              onClick={() => handlePageChange(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CrewList;
