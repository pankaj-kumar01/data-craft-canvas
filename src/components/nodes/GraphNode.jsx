// src/components/nodes/GraphNode.jsx
import React, { useState, useEffect } from "react";
import { Handle, Position } from "@xyflow/react";
import Charts from "../Charts";
import { useFlowData } from "../../hooks/useFlowData";
import { chartTypes } from "../../utils/chartTypes";
import get from "lodash/get";

const GraphNode = ({ id, data = {} }) => {
  const upstream = useFlowData(id) || {};

  // 1) Local state for type, config, chart data, and label
  const [graphType, setGraphType] = useState(data.graphType || "line");
  const [graphConfig, setGraphConfig] = useState(data.graphConfig || {});
  const [chartData, setChartData] = useState([]);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelText, setLabelText] = useState(data.label || "Weather Chart");

  function formatChartData(chartType, data, config) {
    console.log(config);
    switch (chartType) {
      case "line":
      case "area": {
        const xArr = get(data, config.xKey.replace(/^upstream\./, "")) || [];
        const yArr = get(data, config.yKey.replace(/^upstream\./, "")) || [];
        // assume both are arrays of equal length
        return xArr.map((x, i) => ({ x, y: yArr[i] }));
      }

      case "bar": {
        // data is an object → produce two bars
        const catVal = get(data, config.categoryKey.replace(/^upstream\./, ""));
        const valVal = get(data, config.valueKey.replace(/^upstream\./, ""));
        return [
          {
            name: config.categoryKey.split(".").pop(), // e.g. "temp"
            value: catVal,
          },
          {
            name: config.valueKey.split(".").pop(), // e.g. "humidity"
            value: valVal,
          },
        ];
      }
      case "pie": {
        // data is an object → produce two slices

        const labelVal = get(data, config.labelKey.replace(/^upstream\./, ""));
        const valueVal = get(data, config.valueKey.replace(/^upstream\./, ""));

        return [
          {
            name: config.labelKey.split(".").pop(),
            value: labelVal,
          },
          {
            name: config.valueKey.split(".").pop(),
            value: valueVal,
          },
        ];
      }

      default:
        return [];
    }
  }

  // 2) Persist type & config back to node.data so export/import works
  useEffect(() => {
    data.graphType = graphType;
    data.graphConfig = graphConfig;
  }, [graphType, graphConfig, data]);

  // 3) Persist label on blur
  useEffect(() => {
    if (!isEditingLabel) {
      data.label = labelText;
    }
  }, [isEditingLabel, labelText, data]);

  // 4) Handler to manually plot the graph
  const handlePlot = () => {
    const formatted = formatChartData(graphType, upstream, graphConfig);
    console.log(formatted);
    setChartData(formatted);
  };

  // Determine which config fields to show (xKey/yKey, etc.)
  const currentChart = chartTypes.find((t) => t.value === graphType);

  return (
    <div className="graph-node border rounded-md shadow-md bg-white">
      {/* Header: Label + Chart-Type Picker */}
      <div
        className="node-header graph w-full p-2 flex items-center justify-between"
        style={{ background: "green" }}
      >
        {isEditingLabel ? (
          <input
            className="form-input text-sm font-semibold flex-1 mr-2"
            value={labelText}
            onChange={(e) => setLabelText(e.target.value)}
            onBlur={() => setIsEditingLabel(false)}
            autoFocus
          />
        ) : (
          <span
            className="cursor-text text-sm font-semibold text-white flex-1"
            onDoubleClick={() => setIsEditingLabel(true)}
          >
            {labelText}
          </span>
        )}

        <select
          style={{ color: "black", maxWidth: "60%" }}
          value={graphType}
          onChange={(e) => {
            setGraphType(e.target.value);
            setGraphConfig({}); // clear old config
            setChartData([]); // clear old chart
          }}
          className="form-select text-sm"
        >
          {chartTypes.map((ct) => (
            <option key={ct.value} value={ct.value}>
              {ct.label}
            </option>
          ))}
        </select>
      </div>

      {/* Body: Config Inputs + Plot Button + Chart */}
      <div className="p-2 text-xs ">
        {/* 5) Dynamic config inputs */}
        <div style={{textAlign:'right'}}>
          <button
            onClick={handlePlot}
            disabled={currentChart.configFields.some((f) => !graphConfig[f])}
            className="mb-2 px-3 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50"
          >
            Plot Graph
          </button>
        </div>

        {currentChart.configFields.map((field) => (
          <div key={field} className="mb-2">
            <label className="block text-gray-600 text-sm mb-1">{field}</label>
            <input
              type="text"
              className="form-input w-full"
              placeholder={`e.g. main.temp or wind.speed`}
              value={graphConfig[field] || ""}
              onChange={(e) =>
                setGraphConfig((cfg) => ({ ...cfg, [field]: e.target.value }))
              }
            />
          </div>
        ))}

        {/* 7) Render the chart or a placeholder */}
        {chartData.length > 0 ? (
          <div className="node-content mt-2">
            <Charts
              type={graphType}
              data={chartData}
              width={200}
              height={120}
            />
          </div>
        ) : (
          <div className="text-gray-400 mt-2">
            {currentChart.configFields.every((f) => graphConfig[f])
              ? "Click “Plot Graph” to render"
              : "Fill in all fields above to enable plotting"}
          </div>
        )}
      </div>

      {/* React Flow handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        style={{ left: -8 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        style={{ right: -8 }}
      />
    </div>
  );
};

export default GraphNode;
