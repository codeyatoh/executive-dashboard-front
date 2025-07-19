import React from 'react';
import styles from './ExportReport.module.css';
import { AiOutlineFileExcel } from 'react-icons/ai';
import * as XLSX from 'xlsx';

const ExportReport = ({ open, onClose, chartData, orders = [], orderItems = [], crew = [], filter = 'today' }) => {
  if (!open) return null;

  // Date filtering helpers
  const now = new Date();
  const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  let startDate, endDate, dateRangeLabel;
  if (filter === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    dateRangeLabel = startDate.toLocaleDateString();
  } else if (filter === 'week') {
    const dayOfWeek = now.getDay();
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (6 - dayOfWeek), 23, 59, 59, 999);
    dateRangeLabel = `${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`;
  } else if (filter === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    dateRangeLabel = `${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`;
  } else {
    startDate = new Date(0);
    endDate = new Date();
    dateRangeLabel = 'All Dates';
  }
  // Filter orders and orderItems by date
  const filteredOrders = orders.filter(order => {
    if (!order.created_at) return false;
    const d = new Date(order.created_at);
    return d >= startDate && d <= endDate;
  });
  const filteredOrderIds = new Set(filteredOrders.map(o => o.order_id));
  const filteredOrderItems = orderItems.filter(item => filteredOrderIds.has(item.order_id));

  // DEBUG: Log data when modal opens
  console.log('ExportReport DEBUG - orders:', filteredOrders);
  console.log('ExportReport DEBUG - orderItems:', filteredOrderItems);
  console.log('ExportReport DEBUG - chartData:', chartData);

  // Helper: Format currency
  const formatCurrency = (value) => `₱${value.toLocaleString()}`;

  // Helper: Get crew name by crew_id
  const getCrewName = (crew_id) => {
    const c = crew.find(c => String(c.crew_id) === String(crew_id));
    return c ? `${c.first_name} ${c.last_name}` : crew_id || 'N/A';
  };

  // Helper: Get summary data (easy to understand, 3-column layout)
  const getSummaryData = () => {
    const totalSales = filteredOrderItems.reduce((sum, item) => sum + (parseFloat(item.price || 0) * (parseInt(item.quantity) || 0)), 0);
    const totalOrders = filteredOrders.length;
    const totalItems = filteredOrderItems.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    // Best-selling product
    const productMap = {};
    filteredOrderItems.forEach(item => {
      const name = item.item_name || 'Unknown';
      if (!productMap[name]) productMap[name] = { qty: 0, sales: 0 };
      productMap[name].qty += parseInt(item.quantity) || 0;
      productMap[name].sales += (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0);
    });
    let bestProduct = 'N/A', bestQty = 0, bestSales = 0;
    Object.entries(productMap).forEach(([name, { qty, sales }]) => {
      if (qty > bestQty) {
        bestProduct = name;
        bestQty = qty;
        bestSales = sales;
      }
    });
    // Unique products sold
    const uniqueProducts = Object.keys(productMap).length;
    // Most popular category
    const categoryMap = {};
    filteredOrderItems.forEach(item => {
      const cat = item.category || 'Unknown';
      if (!categoryMap[cat]) categoryMap[cat] = 0;
      categoryMap[cat] += parseInt(item.quantity) || 0;
    });
    let bestCategory = 'N/A', bestCatQty = 0;
    Object.entries(categoryMap).forEach(([cat, qty]) => {
      if (qty > bestCatQty) {
        bestCategory = cat;
        bestCatQty = qty;
      }
    });
    // Order status breakdown
    const statusMap = {};
    filteredOrders.forEach(order => {
      const status = order.order_status || 'Unknown';
      if (!statusMap[status]) statusMap[status] = 0;
      statusMap[status]++;
    });
    // Order type breakdown
    const typeMap = {};
    filteredOrders.forEach(order => {
      const type = order.order_type || 'Unknown';
      if (!typeMap[type]) typeMap[type] = 0;
      typeMap[type]++;
    });
    // Use the filter's date range label
    const dateRange = dateRangeLabel;
    // Build improved summary array (3 columns: Metric, Description, Value)
    const summary = [
      ['SALES OVERVIEW', '', ''],
      ['Total Sales', 'All sales in the period', formatCurrency(totalSales)],
      ['Average Order Value', 'Average sales per order', formatCurrency(avgOrderValue)],
      ['', '', ''],
      ['PRODUCT OVERVIEW', '', ''],
      ['Most Sold Product', 'Product with highest quantity', `${bestProduct} (${bestQty}, ${formatCurrency(bestSales)})`],
      ['Unique Products Sold', 'Number of different products', uniqueProducts],
      ['Most Popular Category', 'Category with most items sold', `${bestCategory} (${bestCatQty})`],
      ['', '', ''],
      ['ORDER OVERVIEW', '', ''],
      ['Total Orders', 'Number of orders', totalOrders],
      ['Total Items Sold', 'All items sold in the period', totalItems],
      ['', '', ''],
      ['ORDER BREAKDOWN', '', ''],
    ];
    Object.entries(statusMap).forEach(([status, count]) => {
      summary.push([
        `Orders: ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        `Orders marked as ${status.toLowerCase()}`,
        count
      ]);
    });
    Object.entries(typeMap).forEach(([type, count]) => {
      summary.push([
        `Orders: ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        `Orders for ${type.toLowerCase()}`,
        count
      ]);
    });
    summary.push(['', '', '']);
    summary.push(['REPORT DATE RANGE', 'Period covered by this report', dateRange]);
    return summary;
  };

  // Helper: Get detailed sales data (easy to understand)
  const getDetailedSalesData = () => {
    const header = ['Order ID', 'Order Date/Time', 'Status', 'Type', 'Crew Name', 'Item', 'Category', 'Quantity', 'Price', 'Subtotal', 'Order Total'];
    const desc = [
      'Unique order number', 'Date and time of order', 'Order status', 'Order type', 'Crew member who handled order', 'Product name', 'Product category', 'Qty sold', 'Unit price', 'Total for this item', 'Total for the order'
    ];
    const rows = [];
    filteredOrders.forEach(order => {
      const orderDate = order.created_at ? new Date(order.created_at).toLocaleString() : '';
      const items = filteredOrderItems.filter(item => item.order_id === order.order_id);
      if (items.length === 0) {
        rows.push([
          order.order_id,
          orderDate,
          order.order_status || '',
          order.order_type || '',
          getCrewName(order.crew_id),
          'NO ITEMS', '', '', '', '', order.total_price || ''
        ]);
      } else {
        items.forEach(item => {
          rows.push([
            order.order_id,
            orderDate,
            order.order_status || '',
            order.order_type || '',
            getCrewName(order.crew_id),
            item.item_name || '',
            item.category || '',
            item.quantity || 0,
            formatCurrency(parseFloat(item.price || 0)),
            formatCurrency((parseFloat(item.price || 0)) * (parseInt(item.quantity) || 0)),
            order.total_price ? formatCurrency(parseFloat(order.total_price)) : ''
          ]);
        });
      }
    });
    return [header, desc, ...rows];
  };

  // Helper: Get hourly/daily sales data (easy to understand)
  const getHourlySalesData = () => {
    if (!chartData) return [];
    const { labels } = chartData;
    const header = ['Hour/Day', 'Product', 'Quantity Sold', 'Total Sales'];
    const desc = [
      'Time slot (hour or day)', 'Product name', 'Qty sold in this slot', 'Total sales for this product in this slot'
    ];
    const rows = [];
    labels.forEach(label => {
      let slotOrders = [];
      if (labels.length === 10) {
        slotOrders = filteredOrders.filter(order => {
          if (!order.created_at) return false;
          const d = new Date(order.created_at);
          let hour = d.getHours();
          let slotLabel = hour === 12 ? '12PM' : hour > 12 ? `${hour - 12}PM` : `${hour}AM`;
          return slotLabel === label;
        });
      } else {
        slotOrders = filteredOrders.filter(order => {
          if (!order.created_at) return false;
          const d = new Date(order.created_at);
          const dayIdx = d.getDay();
          const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          return weekDays[dayIdx] === label;
        });
      }
      const productMap = {};
      slotOrders.forEach(order => {
        filteredOrderItems.filter(item => item.order_id === order.order_id).forEach(item => {
          const name = item.item_name || 'Unknown';
          if (!productMap[name]) productMap[name] = { qty: 0, total: 0 };
          productMap[name].qty += parseInt(item.quantity) || 0;
          productMap[name].total += (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0);
        });
      });
      Object.entries(productMap).forEach(([product, { qty, total }]) => {
        rows.push([
          label,
          product,
          qty,
          formatCurrency(total)
        ]);
      });
      if (Object.keys(productMap).length === 0) {
        rows.push([label, 'No Sales', 0, formatCurrency(0)]);
      }
    });
    return [header, desc, ...rows];
  };

  // Helper: Get profit analysis data (easy to understand)
  const getProfitAnalysisData = () => {
    const header = [
      'Order ID', 'Order Date/Time', 'Status', 'Type', 'Crew Name', 'Total Sales', 'Cost', 'Profit', '# Items', 'Top Item (Qty)', 'Notes'
    ];
    const desc = [
      'Unique order number', 'Date and time of order', 'Order status', 'Order type', 'Crew member who handled order', 'Total sales for this order', 'Total cost (if available)', 'Profit = Sales - Cost', 'Total items in order', 'Most sold item in this order', 'Special notes (e.g., high value order)'
    ];
    const rows = filteredOrders.map(order => {
      const orderDate = order.created_at ? new Date(order.created_at).toLocaleString() : '';
      const items = filteredOrderItems.filter(item => item.order_id === order.order_id);
      const sales = items.reduce((sum, item) => sum + (parseFloat(item.price || 0) * (parseInt(item.quantity) || 0)), 0);
      const cost = 0;
      const profit = sales - cost;
      const numItems = items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
      let bestItem = 'N/A', bestQty = 0;
      const itemMap = {};
      items.forEach(item => {
        const name = item.item_name || 'Unknown';
        if (!itemMap[name]) itemMap[name] = 0;
        itemMap[name] += parseInt(item.quantity) || 0;
      });
      Object.entries(itemMap).forEach(([name, qty]) => {
        if (qty > bestQty) {
          bestItem = name;
          bestQty = qty;
        }
      });
      let notes = '';
      if (items.length === 0) notes = 'No items';
      else if (sales > 1000) notes = 'High value order';
      return [
        order.order_id,
        orderDate,
        order.order_status || '',
        order.order_type || '',
        getCrewName(order.crew_id),
        formatCurrency(sales),
        formatCurrency(cost),
        formatCurrency(profit),
        numItems,
        bestItem !== 'N/A' ? `${bestItem} (${bestQty})` : bestItem,
        notes
      ];
    });
    return [header, desc, ...rows];
  };

  // Helper: Sanitize data for Excel
  const sanitizeSheetData = (data) => {
    return data
      .filter(row => Array.isArray(row) && row.length > 0)
      .map(row => row.map(cell => (cell === undefined || cell === null) ? '' : String(cell)));
  };

  // Helper: Auto-size columns for any worksheet
  const autoSizeSheet = (ws, data) => {
    const colWidths = data[0].map((_, colIdx) => {
      const maxLen = data.reduce((max, row) => {
        const val = row[colIdx] ? String(row[colIdx]) : '';
        return Math.max(max, val.length);
      }, 10); // minimum width 10
      return { wch: maxLen + 2 };
    });
    ws['!cols'] = colWidths;
  };

  // Helper: Apply theme styles to a worksheet
  const applyThemeStyles = (ws, data, options = {}) => {
    // Theme colors
    const dark = '#232323';
    const light = '#bdbdbd';
    const accent = '#e0e0e0';
    const white = '#ffffff';
    // Section header rows (first col, all caps, empty 2nd col)
    data.forEach((row, rIdx) => {
      if (row[0] && row[0] === row[0].toUpperCase() && !row[1] && !row[2]) {
        // Section header
        for (let c = 0; c < row.length; c++) {
          const cell = ws[XLSX.utils.encode_cell({ r: rIdx, c })];
          if (cell) {
            cell.s = {
              font: { bold: true, color: { rgb: white.replace('#', '') } },
              fill: { fgColor: { rgb: dark.replace('#', '') } },
              alignment: { horizontal: 'left', vertical: 'center' },
            };
          }
        }
      }
      // Column header (row 0)
      if (rIdx === 0) {
        for (let c = 0; c < row.length; c++) {
          const cell = ws[XLSX.utils.encode_cell({ r: rIdx, c })];
          if (cell) {
            cell.s = {
              font: { bold: true, color: { rgb: dark.replace('#', '') } },
              fill: { fgColor: { rgb: light.replace('#', '') } },
              alignment: { horizontal: 'center', vertical: 'center' },
            };
          }
        }
      }
      // Description row (row 1)
      if (rIdx === 1) {
        for (let c = 0; c < row.length; c++) {
          const cell = ws[XLSX.utils.encode_cell({ r: rIdx, c })];
          if (cell) {
            cell.s = {
              font: { color: { rgb: dark.replace('#', '') } },
              fill: { fgColor: { rgb: accent.replace('#', '') } },
              alignment: { horizontal: 'left', vertical: 'center' },
            };
          }
        }
      }
    });
  };

  // Export to real Excel file using SheetJS
  const handleExcelExport = () => {
    // DEBUG: Log data before export
    console.log('ExportReport DEBUG (on export) - orders:', filteredOrders);
    console.log('ExportReport DEBUG (on export) - orderItems:', filteredOrderItems);
    console.log('ExportReport DEBUG (on export) - chartData:', chartData);
    const wb = XLSX.utils.book_new();
    // Summary Reports
    const summaryData = sanitizeSheetData(getSummaryData());
    console.log('ExportReport DEBUG - summaryData:', summaryData);
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    autoSizeSheet(wsSummary, summaryData);
    applyThemeStyles(wsSummary, summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary Reports');
    // Detailed Sales
    const detailedData = sanitizeSheetData(getDetailedSalesData());
    console.log('ExportReport DEBUG - detailedData:', detailedData);
    const wsDetailed = XLSX.utils.aoa_to_sheet(detailedData);
    autoSizeSheet(wsDetailed, detailedData);
    applyThemeStyles(wsDetailed, detailedData);
    XLSX.utils.book_append_sheet(wb, wsDetailed, 'Detailed Sales');
    // Hourly Sales
    const hourlyData = sanitizeSheetData(getHourlySalesData());
    console.log('ExportReport DEBUG - hourlyData:', hourlyData);
    const wsHourly = XLSX.utils.aoa_to_sheet(hourlyData);
    autoSizeSheet(wsHourly, hourlyData);
    applyThemeStyles(wsHourly, hourlyData);
    XLSX.utils.book_append_sheet(wb, wsHourly, 'Hourly Sales');
    // Profit Analysis
    const profitData = sanitizeSheetData(getProfitAnalysisData());
    console.log('ExportReport DEBUG - profitData:', profitData);
    const wsProfit = XLSX.utils.aoa_to_sheet(profitData);
    autoSizeSheet(wsProfit, profitData);
    applyThemeStyles(wsProfit, profitData);
    XLSX.utils.book_append_sheet(wb, wsProfit, 'Profit Analysis');
    // Exported at info
    const now = new Date();
    wb.Props = { Title: 'Sales Report', CreatedDate: now };
    // Use a unique filename to avoid Excel caching
    const filename = `sales_report_${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}_${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}${now.getSeconds().toString().padStart(2,'0')}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Export Sales Report</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <div className={styles.modalBody}>
          <p className={styles.exportText}>Download your sales report as an Excel file for further analysis.</p>
          <div className={styles.exportOptions}>
            <button className={styles.excelBtn} onClick={handleExcelExport}>
              <AiOutlineFileExcel style={{ marginRight: 8, fontSize: '1.3em' }} />
              Download as Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportReport;
