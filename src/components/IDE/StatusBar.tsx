import React from 'react';
import { Files, Terminal, Settings, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import type { VFile, CompilerLanguage } from '../../services/workspaceService';

interface StatusBarProps {
  activeFile: VFile | null;
  isRunning: boolean;
  output: string;
  fontSize: number;
  onToggleExplorer: () => void;
  onToggleTerminal: () => void;
  onToggleSettings: () => void;
  onRun: () => void;
  explorerVisible: boolean;
  terminalVisible: boolean;
}

const StatusBar: React.FC<StatusBarProps> = ({
  activeFile,
  isRunning,
  output,
  fontSize,
  onToggleExplorer,
  onToggleTerminal,
  onToggleSettings,
  onRun,
  explorerVisible,
  terminalVisible
}) => {
  const getRunStatus = () => {
    if (isRunning) return { 
      icon: Loader2, 
      text: "Running", 
      color: "text-amber-400",
      animate: true
    };
    if (!output) return { 
      icon: AlertCircle, 
      text: "Ready", 
      color: "text-slate-400",
      animate: false
    };
    if (output.includes("Error") || output.includes("error")) return { 
      icon: XCircle, 
      text: "Error", 
      color: "text-red-400",
      animate: false
    };
    return { 
      icon: CheckCircle2, 
      text: "Success", 
      color: "text-emerald-400",
      animate: false
    };
  };

  const runStatus = getRunStatus();
  const RunStatusIcon = runStatus.icon;

  const getLanguageDisplayName = (language: CompilerLanguage): string => {
    switch (language) {
      case 'c':
        return 'C';
      case 'cpp':
        return 'C++';
      case 'java':
        return 'Java';
      case 'javascript':
        return 'JavaScript';
      case 'python':
        return 'Python';
      default:
        return language;
    }
  };

  const formatFileSize = (content: string): string => {
    const bytes = new Blob([content]).size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="h-6 bg-red-600 flex items-center justify-between px-2 text-xs text-white">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Explorer Toggle */}
        <button
          className={`flex items-center gap-1 px-2 py-0.5 hover:bg-white/10 rounded transition-colors ${
            explorerVisible ? 'bg-white/20' : ''
          }`}
          onClick={onToggleExplorer}
          title="Toggle Explorer (Ctrl+Shift+E)"
        >
          <Files className="w-3 h-3" />
          <span>Explorer</span>
        </button>

        {/* Terminal Toggle */}
        <button
          className={`flex items-center gap-1 px-2 py-0.5 hover:bg-white/10 rounded transition-colors ${
            terminalVisible ? 'bg-white/20' : ''
          }`}
          onClick={onToggleTerminal}
          title="Toggle Terminal (Ctrl+`)"
        >
          <Terminal className="w-3 h-3" />
          <span>Terminal</span>
        </button>



        {/* Run Status */}
        <button
          className="flex items-center gap-1 px-2 py-0.5 hover:bg-white/10 rounded transition-colors"
          onClick={onRun}
          disabled={isRunning}
          title={isRunning ? "Running..." : "Run Code (Ctrl+Enter)"}
        >
          <RunStatusIcon className={`w-3 h-3 ${runStatus.animate ? 'animate-spin' : ''}`} />
          <span>{runStatus.text}</span>
        </button>
      </div>

      {/* Center Section - File Info */}
      <div className="flex items-center gap-4">
        {activeFile && (
          <>
            <span className="text-white/80">
              {activeFile.name}
            </span>
            <span className="text-white/60">
              {formatFileSize(activeFile.content)}
            </span>
          </>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Language */}
        {activeFile && (
          <span className="text-white/80 font-medium">
            {getLanguageDisplayName(activeFile.language)}
          </span>
        )}

        {/* Encoding */}
        <span className="text-white/60">
          UTF-8
        </span>

        {/* Font Size */}
        <span className="text-white/60">
          {fontSize}px
        </span>

        {/* Settings */}
        <button
          className="flex items-center gap-1 px-2 py-0.5 hover:bg-white/10 rounded transition-colors"
          onClick={onToggleSettings}
          title="Settings (Ctrl+,)"
        >
          <Settings className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default StatusBar;