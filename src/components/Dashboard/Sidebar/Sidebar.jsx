import React, { useState } from 'react';
import styles from './Sidebar.module.css';
import logo from '../../../assets/images/logo.png';

const Sidebar = ({ open, onClose }) => {

  // Overlay and close button for mobile
  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={open ? styles.overlay + ' ' + styles.overlayVisible : styles.overlay}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={
          styles.sidebar +
          ' ' +
          (open ? styles.sidebarOpen : '')
        }
      >
        {/* Close button for mobile */}
        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close sidebar menu"
          type="button"
        >
          &times;
        </button>
        <div className={styles.logoBox}>
          <img src={logo} alt="AJH Bread & Beans Logo" className={styles.logo} />
        </div>
      </aside>
    </>
  );
};

export default Sidebar;