/**
 * VS Code-like IDE Implementation
 * 
 * Manual Test Checklist:
 * □ Explorer: Create src/newFile.cpp through explorer UI; opens new tab with DEFAULT_CODE.cpp
 * □ Open/Close tabs: Opening same file twice focuses existing tab; closing unsaved tab shows modal
 * □ Save: Ctrl+S saves current tab to workspace; dirty indicator clears
 * □ Run: Ctrl+Enter or Run button calls executeCode with active editor content
 * □ Output: Copy/download works as before
 * □ Resize: Explorer/editor and editor/output resize persists to localStorage
 * □ BeforeUnload: Closing browser with unsaved files triggers confirm
 * □ Language mapping: Creating hello.py sets language python by extension
 */

import React, { useState, useEffect } from 'react';
import { showToast } from '../../utils/toast';
import { executeCode } from '../../services/codeExecutor';
import { workspaceService, type VFile, type CompilerLanguage } from '../../services/workspaceService';

import FileExplorer from './FileExplorer';
import EditorTabs from './EditorTabs';
import EditorPane from './EditorPane';
import TerminalPanel from './TerminalPanel';
import StatusBar from './StatusBar';

const CodeCompiler: React.FC = () => {
  const [activeView, setActiveView] = useState<'explorer' | 'run'>('explorer');
  const [openTabs, setOpenTabs] = useState<VFile[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [input, setInput] = useState('');
  const [fileOutputs, setFileOutputs] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('vscode-file-outputs');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [explorerWidth, setExplorerWidth] = useState(250); // 250px default
  const [terminalHeight, setTerminalHeight] = useState(200); // 200px default
  const [isResizingExplorer, setIsResizingExplorer] = useState(false);
  const [isResizingTerminal, setIsResizingTerminal] = useState(false);

  const [fontSize, setFontSize] = useState(14);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [terminalVisible, setTerminalVisible] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const activeFile = openTabs.find(tab => tab.id === activeTabId) || null;
  const explorerVisible = activeView === 'explorer';

  // Load initial state
  useEffect(() => {
    const savedTabs = workspaceService.getOpenTabs();
    const savedActiveId = workspaceService.getActiveTabId();
    const savedLayout = workspaceService.getLayout();
    
    // Load layout (convert percentage to pixels)
    setExplorerWidth(savedLayout.explorerWidth * window.innerWidth / 100);
    setTerminalHeight(savedLayout.editorHeight * window.innerHeight / 100);
    
    if (savedTabs.length > 0) {
      const files = savedTabs.map(tab => workspaceService.readFile(tab.filePath)).filter(Boolean) as VFile[];
      setOpenTabs(files);
      if (savedActiveId && files.some(f => f.id === savedActiveId)) {
        setActiveTabId(savedActiveId);
      } else if (files.length > 0) {
        setActiveTabId(files[0].id);
      }
    }
  }, []);

  // Save tabs state
  useEffect(() => {
    const tabData = openTabs.map(tab => ({ fileId: tab.id, filePath: tab.path }));
    workspaceService.setOpenTabs(tabData);
    workspaceService.setActiveTabId(activeTabId);
  }, [openTabs, activeTabId]);

  // Save layout
  useEffect(() => {
    const layout = {
      explorerWidth: (explorerWidth / window.innerWidth) * 100,
      editorHeight: (terminalHeight / window.innerHeight) * 100
    };
    workspaceService.setLayout(layout);
  }, [explorerWidth, terminalHeight]);



  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey)) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case 'w':
            e.preventDefault();
            if (activeFile) handleTabClose(activeFile);
            break;
          case 'Enter':
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              handleRun();
            }
            break;
          case 'E':
            if (e.shiftKey) {
              e.preventDefault();
              setActiveView(activeView === 'explorer' ? 'run' : 'explorer');
            }
            break;
          case '`':
            e.preventDefault();
            setTerminalVisible(!terminalVisible);
            break;
          case ',':
            e.preventDefault();
            setIsSettingsOpen(!isSettingsOpen);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFile, activeView, terminalVisible, isSettingsOpen]);

  // Custom events from editor
  useEffect(() => {
    const handleEditorSave = () => handleSave();
    const handleEditorRun = () => handleRun();
    const handleCreateNewFile = () => {
      setActiveView('explorer');
      setTimeout(() => {
        const event = new MouseEvent('click', { bubbles: true });
        document.querySelector('[title="New File in Selected Folder"]')?.dispatchEvent(event);
      }, 100);
    };

    window.addEventListener('editor-save', handleEditorSave);
    window.addEventListener('editor-run', handleEditorRun);
    window.addEventListener('create-new-file', handleCreateNewFile);
    
    return () => {
      window.removeEventListener('editor-save', handleEditorSave);
      window.removeEventListener('editor-run', handleEditorRun);
      window.removeEventListener('create-new-file', handleCreateNewFile);
    };
  }, []);

  // Window resize handler to adjust explorer width
  useEffect(() => {
    const handleWindowResize = () => {
      const maxExplorerWidth = window.innerWidth * 0.6; // Max 60% of screen width
      if (explorerWidth > maxExplorerWidth) {
        setExplorerWidth(maxExplorerWidth);
      }
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [explorerWidth]);

  // Resize handlers
  useEffect(() => {
    if (!isResizingExplorer && !isResizingTerminal) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      if (isResizingExplorer) {
        const newWidth = e.clientX;
        if (newWidth < 50) {
          // Close explorer if dragged very far left
          setExplorerWidth(0);
          setActiveView('run');
        } else if (newWidth <= 500) {
          setExplorerWidth(newWidth);
        }
      }
      if (isResizingTerminal) {
        const newHeight = window.innerHeight - e.clientY;
        if (newHeight >= 100 && newHeight <= 600) {
          setTerminalHeight(newHeight);
        }
      }

    };

    const handleMouseUp = () => {
      setIsResizingExplorer(false);
      setIsResizingTerminal(false);

    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingExplorer, isResizingTerminal]);

  const handleFileSelect = (file: VFile) => {
    // Get fresh file data from workspace
    const freshFile = workspaceService.readFile(file.path);
    if (!freshFile) return;
    
    const existingTab = openTabs.find(tab => tab.path === freshFile.path);
    if (existingTab) {
      // Update existing tab with fresh data
      setOpenTabs(prev => prev.map(tab => tab.path === freshFile.path ? freshFile : tab));
      setActiveTabId(freshFile.id);
    } else {
      setOpenTabs(prev => [...prev, freshFile]);
      setActiveTabId(freshFile.id);
    }
    
    // Load output for this file
    setOutput(fileOutputs[freshFile.path] || '');
  };

  const handleTabClose = (file: VFile) => {
    const newTabs = openTabs.filter(tab => tab.id !== file.id);
    setOpenTabs(newTabs);
    
    if (activeTabId === file.id) {
      const currentIndex = openTabs.findIndex(tab => tab.id === file.id);
      const nextTab = newTabs[currentIndex] || newTabs[currentIndex - 1] || null;
      setActiveTabId(nextTab?.id || null);
    }
  };

  const handleCodeChange = (content: string) => {
    if (!activeFile) return;
    
    // Update content in workspace
    const file = workspaceService.readFile(activeFile.path);
    if (file) {
      file.content = content;
      file.isSaved = false;
      workspaceService['saveWorkspace']();
    }
    
    // Update local state
    const updatedFile = { ...activeFile, content, isSaved: false };
    setOpenTabs(prev => prev.map(tab => tab.id === activeFile.id ? updatedFile : tab));
  };

  const handleSave = () => {
    if (!activeFile) return;
    
    workspaceService.writeFile(activeFile.path, activeFile.content);
    const updatedFile = { ...activeFile, isSaved: true };
    setOpenTabs(prev => prev.map(tab => tab.id === activeFile.id ? updatedFile : tab));
    showToast.success(`Saved ${activeFile.name}`);
  };

  const handleRun = async () => {
    if (!activeFile || isRunning) return;

    // Auto-open terminal if it's closed
    if (!terminalVisible) {
      setTerminalVisible(true);
    }

    setIsRunning(true);
    setOutput('Running...');

    try {
      // Get current tab content (which has the latest changes)
      const currentTab = openTabs.find(tab => tab.id === activeFile.id);
      const currentCode = currentTab?.content || activeFile.content;

      const result = await executeCode({
        language: activeFile.language,
        code: currentCode,
        input
      });

      setOutput(result.output);
      const newOutputs = { ...fileOutputs, [activeFile.path]: result.output };
      setFileOutputs(newOutputs);
      localStorage.setItem('vscode-file-outputs', JSON.stringify(newOutputs));
      
      if (!result.success && result.error) {
        showToast.error(result.error);
      }
    } catch (error: any) {
      setOutput(`Error: ${error.message}`);
      showToast.error(error.message);
    } finally {
      setIsRunning(false);
    }
  };



  const handleReset = () => {
    if (!activeFile) return;
    
    const DEFAULT_CODE: Record<CompilerLanguage, string> = {
      c: `#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}`,
      cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}`,
      java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
      javascript: `console.log("Hello, World!");`,
      python: `print("Hello, World!")`,
    };

    const defaultContent = DEFAULT_CODE[activeFile.language] || '';
    const updatedFile = { ...activeFile, content: defaultContent, isSaved: false };
    setOpenTabs(prev => prev.map(tab => tab.id === activeFile.id ? updatedFile : tab));
    
    const file = workspaceService.readFile(activeFile.path);
    if (file) {
      file.content = defaultContent;
      file.isSaved = false;
      workspaceService['saveWorkspace']();
    }
    
    showToast.success('Code reset to default template');
  };

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden border border-gray-800">
      {/* Main Layout: 3-Panel Structure */}
      <div className="flex-1 flex overflow-hidden">


        {/* Left Panel - File Explorer - Responsive width */}
        {!isFullscreen && explorerVisible && (
          <>
            <div 
              className={`bg-black border-r border-gray-800 flex-shrink-0 h-full transition-transform duration-300 ease-in-out ${
                window.innerWidth < 768 
                  ? 'fixed top-0 left-0 z-50 w-[280px] transform translate-x-0' 
                  : 'relative'
              }`}
              style={{ 
                width: window.innerWidth >= 768 ? `${explorerWidth}px` : '280px',
                transform: window.innerWidth < 768 && !explorerVisible ? 'translateX(-100%)' : 'translateX(0)'
              }}
              id="file-explorer-panel"
            >
              <FileExplorer
                onFileSelect={handleFileSelect}
                isVisible={explorerVisible}
              />
            </div>

            {/* Mobile Overlay */}
            {window.innerWidth < 768 && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={() => setActiveView('run')}
              />
            )}

            {/* Vertical Resizer */}
            <div
              className="w-[2px] cursor-col-resize bg-gray-800 flex-shrink-0 relative"
              onMouseDown={() => setIsResizingExplorer(true)}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-gray-600 rounded-full" />
            </div>
          </>
        )}

        {/* Explorer Toggle Button - Show when explorer is closed */}
        {!isFullscreen && !explorerVisible && (
          <button
            className="fixed top-1/2 left-0 -translate-y-1/2 z-50 p-1 text-gray-400 hover:text-white transition-colors"
            onClick={() => {
              setExplorerWidth(window.innerWidth * 0.25);
              setActiveView('explorer');
            }}
            title="Open Explorer"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        )}

        {/* Center Panel - Code Editor (50-60% width, flexible) */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Editor Tabs */}
          <EditorTabs
            tabs={openTabs}
            activeTabId={activeTabId}
            onTabSelect={handleFileSelect}
            onTabClose={handleTabClose}
            onRun={handleRun}
            isRunning={isRunning}
            onReset={handleReset}
            onFullscreen={() => setIsFullscreen(!isFullscreen)}
            isFullscreen={isFullscreen}
          />

          {/* Editor Area (flexible height) */}
          <div className="flex-1 overflow-hidden" style={{ height: terminalVisible ? `calc(100% - ${terminalHeight}px - 2px)` : '100%' }}>
            <EditorPane
              activeFile={activeFile}
              onCodeChange={handleCodeChange}
              fontSize={fontSize}
              height="100%"
            />
          </div>

          {/* Bottom Panel - Terminal/Output - Responsive height */}
          {terminalVisible && (
            <>
              {/* Horizontal Resizer */}
              <div
                className="h-[2px] cursor-row-resize bg-gray-800 flex-shrink-0 relative"
                onMouseDown={() => setIsResizingTerminal(true)}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-1 w-8 bg-gray-600 rounded-full" />
              </div>

              <div className="flex-shrink-0" style={{ height: window.innerWidth < 768 ? '40vh' : `${terminalHeight}px` }}>
                <TerminalPanel
                  input={input}
                  onInputChange={setInput}
                  isVisible={terminalVisible}
                  onToggle={() => setTerminalVisible(false)}
                  height="100%"
                  output={output}
                  isRunning={isRunning}
                />
              </div>
            </>
          )}
        </div>


      </div>

      {/* Status Bar */}
      {!isFullscreen && (
        <StatusBar
        activeFile={activeFile}
        isRunning={isRunning}
        output={output}
        fontSize={fontSize}
        onToggleExplorer={() => {
          if (activeView === 'explorer') {
            setActiveView('run');
          } else {
            setExplorerWidth(window.innerWidth * 0.25); // Set to 1/4th width
            setActiveView('explorer');
          }
        }}
        onToggleTerminal={() => setTerminalVisible(!terminalVisible)}

        onToggleSettings={() => setIsSettingsOpen(!isSettingsOpen)}
        onRun={handleRun}
        explorerVisible={explorerVisible}
        terminalVisible={terminalVisible}

      />
      )}

      {/* Settings Modal - Responsive */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2D2D30] border border-gray-600 rounded-lg p-4 md:p-6 w-full max-w-sm md:max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base md:text-lg font-semibold text-white">Settings</h2>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Font Size:</label>
                <input
                  type="range"
                  min="10"
                  max="24"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full"
                />
                <span className="text-sm text-gray-400">{fontSize}px</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeCompiler;