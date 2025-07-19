import React from "react";
import styles from "./LogoutModal.module.css";

const LogoutModal = ({ open, onCancel, onLogout }) => {
  if (!open) return null;
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Logout</h2>
        <p className={styles.message}>
          You are going to log out your account.<br />Are you sure?
        </p>
        <div className={styles.buttonGroup}>
          <button className={styles.cancel} onClick={onCancel}>Cancel</button>
          <button className={styles.logout} onClick={onLogout}>Log out</button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal; 