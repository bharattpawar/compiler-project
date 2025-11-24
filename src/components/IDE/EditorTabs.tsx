import React, { useState, useRef, useEffect } from 'react';
import { X, RotateCcw, Play, FileCode, FileText, FileJson, Maximize2, Minimize2 } from 'lucide-react';
import type { VFile } from '@/services/workspaceService';
import { getFileIconClass, getLanguageColor } from '@/utils/fileUtils';

interface EditorTabsProps {
  tabs: VFile[];
  activeTabId: string | null;
  onTabSelect: (file: VFile) => void;
  onTabClose: (file: VFile) => void;
  onTabsReorder?: (tabs: VFile[]) => void;
  onRun?: () => void;
  isRunning?: boolean;
  onReset?: () => void;
  onFullscreen?: () => void;
  isFullscreen?: boolean;
}

interface TabContextMenuProps {
  x: number;
  y: number;
  tab: VFile;
  onClose: () => void;
  onAction: (action: string, tab: VFile) => void;
}

const TabContextMenu: React.FC<TabContextMenuProps> = ({ x, y, tab, onClose, onAction }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed bg-gray-900 border border-gray-600 rounded-md shadow-lg z-50 py-1 min-w-[160px]"
      style={{ left: x, top: y }}
    >
      <button
        className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-gray-800"
        onClick={() => onAction('close', tab)}
      >
        Close
      </button>
      <button
        className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-gray-800"
        onClick={() => onAction('closeOthers', tab)}
      >
        Close Others
      </button>
      <button
        className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-gray-800"
        onClick={() => onAction('closeToRight', tab)}
      >
        Close to the Right
      </button>
      <div className="border-t border-gray-600 my-1" />
      <button
        className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-gray-800"
        onClick={() => onAction('save', tab)}
      >
        Save
      </button>
      <button
        className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-gray-800"
        onClick={() => onAction('revealInExplorer', tab)}
      >
        Reveal in Explorer
      </button>
    </div>
  );
};

const EditorTabs: React.FC<EditorTabsProps> = ({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onTabsReorder,
  onRun,
  isRunning = false,
  onReset,
  onFullscreen,
  isFullscreen = false
}) => {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tab: VFile } | null>(null);
  const [draggedTab, setDraggedTab] = useState<VFile | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleContextMenu = (e: React.MouseEvent, tab: VFile) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      tab
    });
  };

  const handleContextAction = (action: string, tab: VFile) => {
    setContextMenu(null);
    
    switch (action) {
      case 'close':
        onTabClose(tab);
        break;
      case 'closeOthers':
        tabs.filter(t => t.id !== tab.id).forEach(t => onTabClose(t));
        break;
      case 'closeToRight':
        const tabIndex = tabs.findIndex(t => t.id === tab.id);
        tabs.slice(tabIndex + 1).forEach(t => onTabClose(t));
        break;
      case 'save':
        // This would trigger save action - handled by parent
        break;
      case 'revealInExplorer':
        // This would focus the file in explorer - handled by parent
        break;
    }
  };

  const handleDragStart = (e: React.DragEvent, tab: VFile) => {
    setDraggedTab(tab);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (!draggedTab || !onTabsReorder) return;
    
    const dragIndex = tabs.findIndex(tab => tab.id === draggedTab.id);
    if (dragIndex === dropIndex) return;
    
    const newTabs = [...tabs];
    const [removed] = newTabs.splice(dragIndex, 1);
    newTabs.splice(dropIndex, 0, removed);
    
    onTabsReorder(newTabs);
    setDraggedTab(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedTab(null);
    setDragOverIndex(null);
  };

  if (tabs.length === 0) {
    return (
      <div className="h-8 bg-black border-b border-gray-800 flex items-center px-2 md:px-4">
        <span className="text-xs text-gray-500">No files open</span>
      </div>
    );
  }

  return (
    <>
      <div className="h-12 md:h-12.5 bg-black border-b border-gray-800 flex items-center overflow-hidden gap-1 px-1 md:px-2">
        <div className="flex flex-1 overflow-x-auto scrollbar-hide">
          {tabs.map((tab, index) => {
            const isActive = tab.id === activeTabId;
            const isDraggedOver = dragOverIndex === index;
            const iconData = getFileIconClass(tab.name);
            const IconComponent = iconData.icon === 'json' ? FileJson :
                                  iconData.icon === 'code' ? FileCode : FileText;
            
            return (
              <div
                key={tab.id}
                className={`
                  group flex items-center min-w-0 max-w-[100px] md:max-w-[140px] h-[28px] md:h-[32px] px-1.5 md:px-2.5 cursor-pointer relative rounded-md
                  ${isActive 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-transparent text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  }
                  ${isDraggedOver ? 'border-l-2 border-l-gray-500' : ''}
                `}
                onClick={() => onTabSelect(tab)}
                onContextMenu={(e) => handleContextMenu(e, tab)}
                draggable
                onDragStart={(e) => handleDragStart(e, tab)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                title={tab.path}
              >
                
                <span className="mr-1.5 flex-shrink-0">
                  <img 
                    src={(() => {
                      const ext = tab.name.includes('.') ? tab.name.split('.').pop()?.toLowerCase() : '';
                      const map: Record<string, string> = { cpp: 'cplusplus', cc: 'cplusplus', c: 'c', java: 'java', js: 'javascript', jsx: 'react', ts: 'typescript', tsx: 'react', py: 'python', html: 'html5', css: 'css3' };
                      const icon = ext && map[ext] ? map[ext] : 'text';
                      return `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${icon}/${icon}-original.svg`;
                    })()} 
                    alt={tab.name.split('.').pop() || 'file'} 
                    className="w-3.5 h-3.5"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <IconComponent className={`w-3.5 h-3.5 ${isActive ? iconData.color : 'text-gray-500'} hidden`} />
                </span>
                
                <span className="text-xs md:text-xs truncate flex-1 min-w-0">
                  {tab.name}
                </span>
                
                {!tab.isSaved && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white ml-1.5 flex-shrink-0" />
                )}
                
                <button
                  className="ml-1.5 p-0.5 hover:bg-gray-700 rounded flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(tab);
                  }}
                  title="Close (Ctrl+W)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
        
        {tabs.length > 0 && (
          <div className="flex-shrink-0 px-1 md:px-2 flex items-center gap-1 md:gap-2">
            {onRun && (
              <button
                className="px-4 md:px-3 py-3 md:py-1.5 disabled:cursor-not-allowed rounded-lg flex items-center justify-center gap-1 md:gap-1.5 text-xs font-semibold transition-all min-h-[48px] min-w-[48px] md:min-h-auto md:min-w-auto"
                style={{ color: '#F59E0B' }}
                onClick={onRun}
                disabled={isRunning}
                title="Run Code (Ctrl+Enter)"
              >
                <Play className="w-4 h-4 md:w-3.5 md:h-3.5" fill="currentColor" />
                <span className="hidden md:inline">{isRunning ? 'Running...' : 'Run'}</span>
              </button>
            )}
            {onReset && (
              <button
                className="p-1.5 hover:bg-gray-800 rounded flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                onClick={onReset}
                title="Reset Code"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
            {onFullscreen && (
              <button
                className="p-1.5 hover:bg-gray-800 rounded flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                onClick={onFullscreen}
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        )}
      </div>

      {contextMenu && (
        <TabContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          tab={contextMenu.tab}
          onClose={() => setContextMenu(null)}
          onAction={handleContextAction}
        />
      )}
    </>
  );
};

export default EditorTabs;