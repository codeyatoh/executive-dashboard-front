import React, { useEffect, useState } from 'react';
import styles from './OrderList.module.css';
import client from '../../../api/feathers';
import { format } from 'date-fns';
import ViewOrderModal from '../../Modals/ViewOrders/ViewOrders';

const ORDERS_PER_PAGE = 4;

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [crew, setCrew] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    let isMounted = true;

    // Initial fetch
    Promise.all([
      client.service('orders').find(),
      client.service('order_items').find(),
      client.service('crew').find()
    ])
      .then(([ordersRes, orderItemsRes, crewRes]) => {
        if (isMounted) {
          setOrders(ordersRes.data);
          setOrderItems(orderItemsRes.data);
          setCrew(crewRes.data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          console.error('Error fetching orders, order_items, or crew:', err);
          setLoading(false);
        }
      });

    // Real-time listeners
    const updateData = () => {
      Promise.all([
        client.service('orders').find(),
        client.service('order_items').find(),
        client.service('crew').find()
      ]).then(([ordersRes, orderItemsRes, crewRes]) => {
        if (isMounted) {
          setOrders(ordersRes.data);
          setOrderItems(orderItemsRes.data);
          setCrew(crewRes.data);
        }
      });
    };

    const orderService = client.service('orders');
    const orderItemsService = client.service('order_items');
    const crewService = client.service('crew');

    orderService.on('created', updateData);
    orderService.on('patched', updateData);
    orderService.on('removed', updateData);

    orderItemsService.on('created', updateData);
    orderItemsService.on('patched', updateData);
    orderItemsService.on('removed', updateData);

    crewService.on && crewService.on('patched', updateData); // in case crew can be updated

    return () => {
      isMounted = false;
      orderService.removeListener('created', updateData);
      orderService.removeListener('patched', updateData);
      orderService.removeListener('removed', updateData);
      orderItemsService.removeListener('created', updateData);
      orderItemsService.removeListener('patched', updateData);
      orderItemsService.removeListener('removed', updateData);
      crewService.removeListener && crewService.removeListener('patched', updateData);
    };
  }, []);

  if (loading) return <div>Loading...</div>;

  // Pagination logic
  const totalPages = Math.ceil(orders.length / ORDERS_PER_PAGE);
  const paginatedOrders = orders.slice(
    (currentPage - 1) * ORDERS_PER_PAGE,
    currentPage * ORDERS_PER_PAGE
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleView = (order) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedOrder(null);
  };

  return (
    <div className={styles.card}>
      <div className={styles.title}>Order History</div>
      <div className={styles.list}>
        {paginatedOrders.map((order, idx) => {
          let dateTime = '';
          if (order.created_at) {
            const d = new Date(order.created_at);
            dateTime = format(d, 'PPpp'); // e.g. Jul 14, 2025 at 12:30 AM
          } else {
            dateTime = <span style={{ color: 'gray', fontStyle: 'italic' }}>No date</span>;
          }
          return (
            <div className={styles.row} key={order.order_id}>
              <span className={styles.id}>{String((currentPage - 1) * ORDERS_PER_PAGE + idx + 1).padStart(3, '0')}.</span>
              <span className={styles.name}>{dateTime}</span>
              <button className={styles.viewBtn} onClick={() => handleView(order)}>View</button>
            </div>
          );
        })}
      </div>
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              className={styles.viewBtn}
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
      <ViewOrderModal
        open={modalOpen}
        onClose={handleCloseModal}
        order={selectedOrder}
        orderItems={orderItems}
        crew={crew}
      />
    </div>
  );
};

export default OrderList;
