
// src/components/WeatherChart.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const WeatherChart = ({ data }) => {
  // Enhanced validation to ensure data is properly formatted
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.log('Invalid or empty data passed to WeatherChart:', data);
    return <div className="p-4 text-center">No weather data available to display</div>;
  }

  // Make sure each data item has the expected properties
  const validData = data.filter(item => 
    item && typeof item === 'object' && 
    typeof item.name === 'string' && 
    (typeof item.value === 'number' || !isNaN(parseFloat(item.value)))
  );

  if (validData.length === 0) {
    console.log('No valid data items in WeatherChart data:', data);
    return <div className="p-4 text-center">Weather data format is invalid</div>;
  }

  // Ensure numerical values
  const processedData = validData.map(item => ({
    ...item,
    value: typeof item.value === 'number' ? item.value : parseFloat(item.value)
  }));

  return (
    <div style={{ width: '100%', height: 300 }} className="weather-chart">
      <ResponsiveContainer>
        <BarChart data={processedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default React.memo(WeatherChart);
