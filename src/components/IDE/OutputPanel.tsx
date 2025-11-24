import React from 'react';
import { Zap, Copy, Download, Loader2, CheckCircle2, XCircle, AlertCircle, Code2 } from 'lucide-react';
import { showToast } from '@/utils/toast';

interface OutputPanelProps {
  output: string;
  isRunning: boolean;
  onCopy: () => void;
  onDownload: () => void;
  onClear?: () => void;
}

const OutputPanel: React.FC<OutputPanelProps> = ({
  output,
  isRunning,
  onCopy,
  onDownload,
  onClear
}) => {
  const getStatusInfo = () => {
    if (isRunning) return { 
      color: "text-amber-400", 
      bg: "bg-amber-500/10", 
      icon: Loader2, 
      text: "Running" 
    };
    if (!output) return { 
      color: "text-slate-400", 
      bg: "bg-slate-500/10", 
      icon: AlertCircle, 
      text: "Ready" 
    };
    if (output.includes("Error") || output.includes("error")) return { 
      color: "text-red-400", 
      bg: "bg-red-500/10", 
      icon: XCircle, 
      text: "Error" 
    };
    return { 
      color: "text-emerald-400", 
      bg: "bg-emerald-500/10", 
      icon: CheckCircle2, 
      text: "Success" 
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const handleCopy = () => {
    if (output) {
      navigator.clipboard.writeText(output);
      showToast.success("Output copied to clipboard");
      onCopy();
    }
  };

  const handleDownload = () => {
    if (output) {
      const blob = new Blob([output], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "output.txt";
      a.click();
      URL.revokeObjectURL(url);
      showToast.success("Output downloaded");
      onDownload();
    }
  };

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Output Header */}
      <div className="h-8 flex-shrink-0 px-2 md:px-4 bg-black border-b border-gray-800 flex items-center">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 md:gap-3">
            <Zap className="w-4 h-4 text-yellow-400" />
            <h3 className="text-xs md:text-xs font-bold text-white tracking-wide uppercase">
              Output
            </h3>
            {(output || isRunning) && (
              <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${statusInfo.bg}`}>
                <StatusIcon className={`w-3 h-3 ${isRunning ? 'animate-spin' : ''} ${statusInfo.color}`} />
                <span className={statusInfo.color}>{statusInfo.text}</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-1 md:gap-1">
            {output && (
              <button
                onClick={() => onCopy()}
                className="px-1 md:px-2 py-1 hover:bg-gray-800 rounded transition-colors text-xs text-gray-400 hover:text-white flex items-center gap-1"
                title="Copy All (Ctrl+C)"
              >
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Copy</span>
              </button>
            )}
            {output && !isRunning && (
              <>
                <button
                  onClick={handleDownload}
                  className="px-1 md:px-2 py-1 hover:bg-gray-800 rounded transition-colors text-xs text-gray-400 hover:text-white flex items-center gap-1"
                  title="Download"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onClear}
                  className="px-1 md:px-2 py-1 hover:bg-gray-800 rounded transition-colors text-xs text-gray-400 hover:text-white"
                  title="Clear Output"
                >
                  Clear
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Output Content */}
      <div className="flex-1 overflow-auto p-2 md:p-4">
        {!output && !isRunning && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Code2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h2 className="text-lg text-gray-400">No output yet</h2>
              <p className="text-sm text-gray-500 mt-2">Run your code to see results</p>
            </div>
          </div>
        )}

        {isRunning && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300 text-base font-semibold">Executing Code</p>
              <p className="text-gray-500 text-sm mt-2">Please wait...</p>
            </div>
          </div>
        )}

        {output && !isRunning && (
          <>
            <pre className="font-mono text-base text-slate-200 whitespace-pre-wrap break-words leading-loose">
              {output}
            </pre>
            
            {/* Output Statistics */}
            <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-800 mt-4">
              <span>Lines: {output.split('\n').length}</span>
              <span>Characters: {output.length}</span>
              <span>Size: {new Blob([output]).size} bytes</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OutputPanel;