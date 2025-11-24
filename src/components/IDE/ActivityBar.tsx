import React from 'react';
import { Files, Play } from 'lucide-react';

interface ActivityBarProps {
  activeView: 'explorer' | 'run';
  onViewChange: (view: 'explorer' | 'run') => void;
  isExplorerVisible: boolean;
}

const ActivityBar: React.FC<ActivityBarProps> = ({
  activeView,
  onViewChange,
  isExplorerVisible
}) => {
  const iconClass = "w-5 h-5 md:w-6 md:h-6";
  const buttonClass = "w-10 h-10 md:w-12 md:h-12 flex items-center justify-center hover:bg-gray-800 transition-colors duration-200 relative";

  return (
    <div className="w-12 md:w-12 bg-black flex flex-col border-r border-gray-800 border border-gray-700">
      <button
        className={`${buttonClass} ${activeView === 'explorer' ? 'bg-gray-800' : ''}`}
        onClick={() => onViewChange('explorer')}
        title="Explorer (Ctrl+Shift+E)"
      >
        <Files className={`${iconClass} ${activeView === 'explorer' ? 'text-white' : 'text-gray-400'}`} />
        {activeView === 'explorer' && (
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white" />
        )}
      </button>
      
      <button
        className={`${buttonClass} ${activeView === 'run' ? 'bg-gray-800' : ''}`}
        onClick={() => onViewChange('run')}
        title="Run and Debug"
      >
        <Play className={`${iconClass} ${activeView === 'run' ? 'text-white' : 'text-gray-400'}`} />
        {activeView === 'run' && (
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white" />
        )}
      </button>

      <div className="flex-1" />
    </div>
  );
};

export default ActivityBar;