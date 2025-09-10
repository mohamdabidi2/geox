import React, { useRef, useEffect, useState } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// Register Handsontable's modules
registerAllModules();

const HandsontableDataGrid = ({
  data = [],
  columns = [],
  height = 400,
  width = '100%',
  readOnly = false,
  stretchH = 'all',
  autoWrapRow = true,
  autoWrapCol = true,
  rowHeaders = true,
  colHeaders = true,
  contextMenu = true,
  manualRowResize = true,
  manualColumnResize = true,
  manualRowMove = false,
  manualColumnMove = false,
  filters = true,
  dropdownMenu = true,
  multiColumnSorting = true,
  onCellChange = null,
  onSelectionChange = null,
  className = '',
  licenseKey = 'non-commercial-and-evaluation',
  ...otherProps
}) => {
  const hotTableRef = useRef(null);
  const [hotInstance, setHotInstance] = useState(null);

  useEffect(() => {
    if (hotTableRef.current) {
      setHotInstance(hotTableRef.current.hotInstance);
    }
  }, []);

  // Default column configuration
  const defaultColumns = columns.length > 0 ? columns : [
    { data: 'id', title: 'ID', type: 'numeric', readOnly: true, width: 80 },
    { data: 'name', title: 'Name', type: 'text', width: 150 },
    { data: 'status', title: 'Status', type: 'text', width: 100 },
    { data: 'created_at', title: 'Created', type: 'date', width: 120 }
  ];

  const settings = {
    data: data,
    columns: defaultColumns,
    height: height,
    width: width,
    readOnly: readOnly,
    stretchH: stretchH,
    autoWrapRow: autoWrapRow,
    autoWrapCol: autoWrapCol,
    rowHeaders: rowHeaders,
    colHeaders: colHeaders,
    contextMenu: contextMenu,
    manualRowResize: manualRowResize,
    manualColumnResize: manualColumnResize,
    manualRowMove: manualRowMove,
    manualColumnMove: manualColumnMove,
    filters: filters,
    dropdownMenu: dropdownMenu,
    multiColumnSorting: multiColumnSorting,
    licenseKey: licenseKey,
    afterChange: onCellChange,
    afterSelectionEnd: onSelectionChange,
    ...otherProps
  };

  return (
    <div className={`handsontable-container ${className}`}>
      <HotTable
        ref={hotTableRef}
        settings={settings}
      />
    </div>
  );
};

export default HandsontableDataGrid;