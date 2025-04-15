import React, { useState, useRef, useEffect } from 'react';
import { Plus, Globe, Database, Download, Upload, RefreshCw } from 'lucide-react';
import { useFlow } from '../contexts/FlowContext';
import { toast } from '../components/ui/use-toast';

const Toolbar = ({ onAddNode }) => {
  const { exportFlow, importFlow, resetFlow } = useFlow();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleAddNodeClick = (type) => {
    setMenuOpen(false);
    onAddNode?.(type);
  };

  return (
    <div className="toolbar fixed top-4 left-4 right-4 z-10 bg-white shadow-md rounded-lg p-2 flex items-center justify-between">
      <div className="relative" ref={menuRef}>
        <button
          className="btn-toolbar flex items-center space-x-1 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          onClick={() => setMenuOpen(o => !o)}
        >
          <Plus size={18} />
          <span>Add Node</span>
        </button>

        {menuOpen && (
          <div className="absolute mt-2 w-48 bg-white rounded-md shadow-lg z-20">
            <button
              className="w-full flex items-center space-x-2 px-4 py-2 text-left hover:bg-gray-100 transition-colors"
              onClick={() => handleAddNodeClick('http')}
            >
              <Globe size={16} />
              <span>HTTP Request</span>
            </button>
            <button
              className="w-full flex items-center space-x-2 px-4 py-2 text-left hover:bg-gray-100 transition-colors"
              onClick={() => handleAddNodeClick('graphql')}
            >
              <Database size={16} />
              <span>GraphQL Request</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <button
          className="btn-toolbar flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          onClick={() => {
            const flow = exportFlow();
            const uri = `data:application/json;charset=utf-8,${encodeURIComponent(
              JSON.stringify(flow, null, 2)
            )}`;
            const link = document.createElement('a');
            link.href = uri;
            link.download = `flow-${new Date().toISOString().slice(0,10)}.json`;
            link.click();
            toast({ title: 'Flow Exported', description: 'Your flow has been exported as JSON' });
          }}
          title="Export"
        >
          <Download size={18} />
        </button>
        <button
          className="btn-toolbar flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                try {
                  const flow = JSON.parse(ev.target.result);
                  const ok = importFlow(flow);
                  toast({
                    title: ok ? 'Flow Imported' : 'Import Failed',
                    description: ok ? 'Imported successfully' : 'Invalid flow file',
                    variant: ok ? undefined : 'destructive'
                  });
                } catch {
                  toast({ title: 'Import Failed', description: 'Could not parse file', variant: 'destructive' });
                }
              };
              reader.readAsText(file);
            };
            input.click();
          }}
          title="Import"
        >
          <Upload size={18} />
        </button>
        <button
          className="btn-toolbar flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          onClick={() => {
            if (window.confirm('Reset the flow? This deletes all nodes and edges.')) {
              resetFlow();
              toast({ title: 'Flow Reset', description: 'Flow has been reset' });
            }
          }}
          title="Reset"
        >
          <RefreshCw size={18} />
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
