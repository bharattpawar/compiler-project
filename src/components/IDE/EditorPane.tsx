import React, { useCallback, useRef, useEffect } from 'react';
import { Code2, Plus } from 'lucide-react';
import CompilerMonacoEditor from '../compilermonocoeditor';
import type { VFile } from '../../services/workspaceService';
import * as monaco from 'monaco-editor';

interface EditorPaneProps {
  activeFile: VFile | null;
  onCodeChange: (content: string) => void;
  fontSize: number;
  height: string;
}

const EditorPane: React.FC<EditorPaneProps> = ({
  activeFile,
  onCodeChange,
  fontSize,
  height
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount = useCallback((editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    

    
    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Save command - will be handled by parent component
      const event = new CustomEvent('editor-save');
      window.dispatchEvent(event);
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      // Run command - will be handled by parent component
      const event = new CustomEvent('editor-run');
      window.dispatchEvent(event);
    });
  }, []);

  const handleCodeChange = (value: string) => {
    onCodeChange(value);
  };

  // Update editor content when active file changes
  useEffect(() => {
    if (editorRef.current && activeFile) {
      const model = editorRef.current.getModel();
      if (model && model.getValue() !== activeFile.content) {
        editorRef.current.setValue(activeFile.content);
      }
    }
  }, [activeFile?.id]);

  if (!activeFile) {
    return (
      <div className="flex items-center justify-center h-full bg-black  pt-2">
        <div className="text-center max-w-md">
          <Code2 className="w-20 h-20 mx-auto text-gray-600 mb-6" />
          <h2 className="text-xl font-semibold text-gray-300 mb-3">No File Open</h2>
          <p className="text-sm text-gray-500 mb-8">Create or select a file to start coding</p>
          
          <button
            className="px-5 py-2.5 bg-[#007ACC] hover:bg-[#005A9E] text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2 mx-auto mb-8"
            onClick={() => {
              const event = new CustomEvent('create-new-file');
              window.dispatchEvent(event);
            }}
          >
            <Plus className="w-4 h-4" />
            Create New File
          </button>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-700" />
            <span className="text-xs text-gray-600">shortcuts</span>
            <div className="flex-1 h-px bg-gray-700" />
          </div>
          
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <kbd className="px-2 py-1 bg-[#2D2D30] rounded text-xs text-gray-400 border border-gray-700">Ctrl+Shift+E</kbd>
            <span>Explorer</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-black pl-4 pt-4" style={{ height }}>
      <CompilerMonacoEditor
        height="100%"
        language={activeFile.language}
        value={activeFile.content}
        onChange={handleCodeChange}
        onMount={handleEditorDidMount}
        fontSize={fontSize}
      />
    </div>
  );
};

export default EditorPane;