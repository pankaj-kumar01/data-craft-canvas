import get from 'lodash/get';


  export function formatChartData(chartType, data, config) {
    switch (chartType) {
      case 'line':
      case 'area': {
        const xArr = get(data, config.xKey) || [];
        const yArr = get(data, config.yKey) || [];
        // assume both are arrays of equal length
        return xArr.map((x, i) => ({ x, y: yArr[i] }));
      }
  
      case 'bar': {
        // assume data is an array of objects
        return (Array.isArray(data) ? data : []).map(item => ({
          name: resolvePath(item, config.categoryKey),
          value: resolvePath(item, config.valueKey),
        }));
      }
  
      case 'pie': {
        return (Array.isArray(data) ? data : []).map(item => ({
          name: resolvePath(item, config.labelKey),
          value: resolvePath(item, config.valueKey),
        }));
      }
  
      default:
        return [];
    }
  }
  