// src/utils/chartTypes.js
export const chartTypes = [
    {
      label: 'Line Chart',
      value: 'line',
      configFields: ['xKey', 'yKey'],
    },
    {
      label: 'Area Chart',
      value: 'area',
      configFields: ['xKey', 'yKey'],
    },
    {
      label: 'Bar Chart',
      value: 'bar',
      configFields: ['categoryKey', 'valueKey'],
    },
    {
      label: 'Pie Chart',
      value: 'pie',
      configFields: ['labelKey', 'valueKey'],
    },
  ];
  