import React, { useState, useRef, useEffect } from 'react';
import { Terminal, X } from 'lucide-react';

interface TerminalPanelProps {
  input: string;
  onInputChange: (input: string) => void;
  isVisible: boolean;
  onToggle: () => void;
  height: string;
  output?: string;
  isRunning?: boolean;
}

const TerminalPanel: React.FC<TerminalPanelProps> = ({
  input,
  onInputChange,
  isVisible,
  onToggle,
  height,
  output = '',
  isRunning = false
}) => {
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  const handleInputSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      // Add to history
      const newHistory = [...inputHistory];
      if (newHistory[newHistory.length - 1] !== input) {
        newHistory.push(input);
        setInputHistory(newHistory);
      }
      setHistoryIndex(-1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (inputHistory.length > 0) {
        const newIndex = historyIndex === -1 ? inputHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        onInputChange(inputHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex >= 0) {
        const newIndex = historyIndex + 1;
        if (newIndex >= inputHistory.length) {
          setHistoryIndex(-1);
          onInputChange('');
        } else {
          setHistoryIndex(newIndex);
          onInputChange(inputHistory[newIndex]);
        }
      }
    } else {
      handleInputSubmit(e);
    }
  };



  if (!isVisible) return null;

  return (
    <div className="bg-black border-t border-gray-800" style={{ height }}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-black border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
            Terminal
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="p-1 hover:bg-gray-800 rounded"
            onClick={onToggle}
            title="Hide terminal"
          >
            <X className="w-3 h-3 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 p-4 flex flex-col font-mono text-sm">
        {/* Output Section */}
        {(output || isRunning) && (
          <div className="flex-1 mb-4 overflow-auto">
            {isRunning ? (
              <div className="text-yellow-400">Running...</div>
            ) : (
              <pre className="text-gray-200 whitespace-pre-wrap">{output}</pre>
            )}
          </div>
        )}
        
        {/* Input Section */}
        <div className="flex items-center gap-2">
          <span className="text-green-400 flex-shrink-0">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-gray-200 outline-none border-none"
            placeholder="Enter input for your program..."
            spellCheck={false}
          />
        </div>
        
        {inputHistory.length > 0 && (
          <div className="mt-4 text-xs text-gray-500">
            <div className="mb-2">Recent inputs:</div>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {inputHistory.slice(-5).map((historyItem, index) => (
                <div
                  key={index}
                  className="cursor-pointer hover:text-gray-400 truncate"
                  onClick={() => onInputChange(historyItem)}
                >
                  $ {historyItem}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {!output && !isRunning && (
          <div className="mt-4 text-xs text-gray-500">
            <div className="mb-1">Tips:</div>
            <ul className="space-y-1 text-gray-600">
              <li>• Use ↑/↓ arrows to navigate input history</li>
              <li>• Press Enter to add input to history</li>
              <li>• Input will be passed to your program when you run it</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default TerminalPanel;