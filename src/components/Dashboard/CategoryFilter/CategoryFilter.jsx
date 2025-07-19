import React, { useState } from 'react';
import styles from './CategoryFilter.module.css';

const categories = ['Coffee', 'Bread'];

const CategoryFilter = ({ selected, onChange }) => {
  const [active, setActive] = useState(selected || categories[0]);

  const handleSelect = (cat) => {
    setActive(cat);
    if (onChange) onChange(cat);
  };

  return (
    <div className={styles.buttonGroup}>
      <button
        className={`${styles.filterButton} ${active === 'Coffee' ? styles.active : ''}`}
        onClick={() => handleSelect('Coffee')}
      >
        Coffee
      </button>
      <button
        className={`${styles.filterButton} ${active === 'Bread' ? styles.active : ''}`}
        onClick={() => handleSelect('Bread')}
      >
        Bread
      </button>
    </div>
  );
};

export default CategoryFilter;
