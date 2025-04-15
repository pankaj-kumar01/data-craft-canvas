// src/components/nodes/GraphNode.jsx
import React, { useState, useEffect, useRef } from "react";
import { Handle, Position } from "@xyflow/react";
import WeatherChart from "../../components/WeatherChart";
import { formatWeatherData } from "../../utils/formatWeatherData";

import { useFlowData } from "../../hooks/useFlowData";

const GraphNode = ({ id, data }) => {
  const upstream = useFlowData(id);
  const [graphData, setGraphData] = useState({});
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelText, setLabelText] = useState(data.label || 'Weather Chart');

  const chartData = useRef(Object.entries(graphData).length > 0 ? formatWeatherData(graphData) : graphData);

  useEffect(() => {
    if (upstream) {
      setGraphData(upstream);
      chartData.current = formatWeatherData(upstream);
    }
  }, [upstream, id]);

  useEffect(() => {
    if (!isEditingLabel && labelText !== data.label) {
      data.label = labelText; // optional if label needs to persist
    }
  }, [isEditingLabel, labelText, data]);

  return (
    <div className="graph-node border rounded-md shadow-md bg-white">
      <div style={{background:'green'}} className="node-header graph flex items-center justify-between p-2 bg-green-100">
        <div className="flex items-center gap-2">
          {isEditingLabel ? (
            <input
              className="form-input text-sm font-semibold"
              value={labelText}
              onChange={e => setLabelText(e.target.value)}
              onBlur={() => setIsEditingLabel(false)}
              autoFocus
            />
          ) : (
            <span
              className="cursor-text text-sm font-semibold"
              onDoubleClick={() => setIsEditingLabel(true)}
            >
              {labelText}
            </span>
          )}
        </div>
      </div>

      <div className="p-2 text-xs">
        {Object.keys(graphData).length > 0 ? (
          <div className="node-content">
            <WeatherChart data={chartData.current} />
          </div>
        ) : (
          <div className="text-gray-400">No upstream data</div>
        )}
      </div>

      <Handle type="target" position={Position.Left} id="in" style={{ left: -8 }} />
      <Handle type="source" position={Position.Right} id="out" style={{ right: -8 }} />
    </div>
  );
};

export default GraphNode;