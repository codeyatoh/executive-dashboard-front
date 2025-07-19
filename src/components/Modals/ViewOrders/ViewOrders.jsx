import React from 'react';
import styles from './ViewOrder.module.css';
import { format } from 'date-fns';

const ViewOrderModal = ({ open, onClose, order, orderItems, crew }) => {
  if (!open || !order) return null;

  // Find crew info
  let crewInfo = null;
  if (crew && order.crew_id) {
    crewInfo = crew.find(c => c.crew_id === order.crew_id);
  }

  // Get items for this order
  const items = orderItems
    ? orderItems.filter(item => String(item.order_id) === String(order.order_id))
    : [];

  // Calculate total cost
  const totalCost = items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.title}>Order Details</div>
        <div className={styles.section}>
          <span className={styles.label}>Date:</span>
          <span className={styles.value}>{order.created_at ? format(new Date(order.created_at), 'PPpp') : 'N/A'}</span>
        </div>
        <div className={styles.section}>
          <span className={styles.label}>Crew Name:</span>
          <span className={styles.value}>{crewInfo ? `${crewInfo.first_name} ${crewInfo.last_name}` : 'N/A'}</span>
        </div>
        <div className={styles.section}>
          <span className={styles.label}>Crew ID:</span>
          <span className={styles.value}>{crewInfo ? crewInfo.crew_id : order.crew_id || 'N/A'}</span>
        </div>
        <div className={styles.section}>
          <span className={styles.label}>Order Type:</span>
          <span className={styles.value}>{order.order_type ? order.order_type : 'N/A'}</span>
        </div>
        <div className={styles.section}>
          <span className={styles.label}>Order Items:</span>
          <div className={styles.orderItemsList}>
            {items.length === 0 ? (
              <div className={styles.orderItemRow} style={{ color: '#bdbdbd' }}>No items</div>
            ) : (
              items.map((item, idx) => (
                <div className={styles.orderItemRow} key={item.item_id || idx}>
                  <span>{item.item_name}</span>
                  <span>Qty: {item.quantity}</span>
                  <span>₱{item.price ? item.price.toLocaleString('en-PH') : '0'}</span>
                </div>
              ))
            )}
          </div>
          {items.length > 0 && (
            <div className={styles.totalCostRow}>
              <span className={styles.label}>Total Cost:</span>
              <span className={styles.value} style={{ fontWeight: 700, fontSize: '1.08em' }}>₱{totalCost.toLocaleString('en-PH')}</span>
            </div>
          )}
        </div>
        <div className={styles.buttonGroup}>
          <button className={styles.closeBtn} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default ViewOrderModal;
