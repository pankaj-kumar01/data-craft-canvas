
import React from 'react';
import { 
  Plus, 
  Globe, 
  Database, 
  Save, 
  Upload, 
  Download,
  RefreshCw
} from 'lucide-react';
import { useFlow } from '../contexts/FlowContext';
import { toast } from '../components/ui/use-toast';

const Toolbar = ({ onAddNode }) => {
  const { exportFlow, importFlow, resetFlow } = useFlow();
  
  const handleExport = () => {
    const flow = exportFlow();
    const dataStr = JSON.stringify(flow, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = `flow-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Flow Exported",
      description: "Your flow has been exported as JSON",
    });
  };
  
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const flow = JSON.parse(event.target.result);
          const success = importFlow(flow);
          
          if (success) {
            toast({
              title: "Flow Imported",
              description: "Your flow has been imported successfully",
            });
          } else {
            toast({
              title: "Import Failed",
              description: "The uploaded file is not a valid flow",
              variant: "destructive"
            });
          }
        } catch (error) {
          toast({
            title: "Import Failed",
            description: "Failed to parse the flow file",
            variant: "destructive"
          });
        }
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  };
  
  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset the flow? This will delete all nodes and edges.')) {
      resetFlow();
      toast({
        title: "Flow Reset",
        description: "Your flow has been reset to the initial state",
      });
    }
  };
  
  return (
    <div className="toolbar fixed top-4 left-4 right-4 z-10 bg-white shadow-md rounded-lg p-2 flex items-center justify-between">
      <div className="flex items-center">
        <div className="dropdown relative group">
          <button className="btn-toolbar flex items-center space-x-1 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
            <Plus size={18} />
            <span>Add Node</span>
          </button>
          <div className="dropdown-menu hidden group-hover:block absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10">
            <button
              className="w-full flex items-center space-x-2 px-4 py-2 text-left hover:bg-gray-100 transition-colors"
              onClick={() => onAddNode('http')}
            >
              <Globe size={16} />
              <span>HTTP Request</span>
            </button>
            <button
              className="w-full flex items-center space-x-2 px-4 py-2 text-left hover:bg-gray-100 transition-colors"
              onClick={() => onAddNode('graphql')}
            >
              <Database size={16} />
              <span>GraphQL Request</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          className="btn-toolbar flex items-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          onClick={handleExport}
          title="Export Flow"
        >
          <Download size={18} />
          <span className="hidden sm:inline">Export</span>
        </button>
        <button
          className="btn-toolbar flex items-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          onClick={handleImport}
          title="Import Flow"
        >
          <Upload size={18} />
          <span className="hidden sm:inline">Import</span>
        </button>
        <button
          className="btn-toolbar flex items-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          onClick={handleReset}
          title="Reset Flow"
        >
          <RefreshCw size={18} />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
