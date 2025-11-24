import React from 'react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

interface CompilerMonacoEditorProps {
  height: string;
  language: string;
  value: string;
  onChange: (value: string) => void;
  onMount: (
    editor: monaco.editor.IStandaloneCodeEditor,
    monaco: typeof import('monaco-editor')
  ) => void;
  fontSize: number;
}

const CompilerMonacoEditor: React.FC<CompilerMonacoEditorProps> = ({
  height,
  language,
  value,
  onChange,
  onMount,
  fontSize
}) => {

  const getMonacoLanguage = (lang: string): string => {
    const languageMap: Record<string, string> = {
      c: 'c',
      cpp: 'cpp',
      java: 'java',
      javascript: 'javascript',
      python: 'python'
    };
    return languageMap[lang] || 'plaintext';
  };

  return (
    <Editor
      height={height}
      language={getMonacoLanguage(language)}
      value={value}
      onChange={(val) => onChange(val || '')}
      onMount={(editor, monacoInstance) => {
        monacoInstance.editor.defineTheme('premium-black-theme', {
          base: 'vs-dark',
          inherit: true,
          rules: [],
          colors: {
            'editor.background': '#000000',
            'editor.foreground': '#ffffff',
            'editorLineNumber.foreground': '#6b7280',
            'editor.selectionBackground': '#1f2937',
            'editor.lineHighlightBackground': '#1f2937',
            'editorCursor.foreground': '#ffffff',
            'editorWhitespace.foreground': '#4b5563',
            'editorIndentGuide.background': '#4b5563',
            'editorIndentGuide.activeBackground': '#6b7280'
          }
        });
        monacoInstance.editor.setTheme('premium-black-theme');
        onMount(editor, monacoInstance);
      }}
      theme="premium-black-theme"
      options={{
        fontSize: window.innerWidth < 768 ? Math.max(12, fontSize - 2) : fontSize,
        fontFamily: 'Consolas, "Courier New", monospace',
        minimap: { enabled: window.innerWidth >= 1024 },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        insertSpaces: true,
        wordWrap: 'on',
        lineNumbers: window.innerWidth >= 640 ? 'on' : 'off',
        renderWhitespace: 'selection',
        glyphMargin: window.innerWidth >= 768,
        folding: window.innerWidth >= 768,
        lineDecorationsWidth: window.innerWidth >= 768 ? undefined : 0,
        lineNumbersMinChars: window.innerWidth >= 768 ? undefined : 0,

        // 🔥 BRACKET HIGHLIGHT + CONNECTING LINE REMOVED
        bracketPairColorization: { enabled: false },
        guides: {
          bracketPairs: false,
          indentation: true
        }
      }}
    />
  );
};

export default CompilerMonacoEditor;
