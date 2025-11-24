// utils/editorHelpers.ts
import { getLanguageKeywords, type Language as KeywordLanguage } from "@/utils/languageKeywords";
import { logError } from "@/utils/toast";
import type { OnMount } from "@monaco-editor/react";

export const createEditorDidMountHandler = (
  setIsEditorReady: (ready: boolean) => void,
  setShowSettings: (show: boolean) => void,
  theme: string,
  toggleFullscreen: () => void,
  editorRef: React.MutableRefObject<unknown>,
  isStartingTemplate?: () => boolean // Add parameter to check if on starting template
): OnMount => {
  return (editor, monacoInstance) => {
    editorRef.current = editor;

    // Force dark theme background
    const editorElement = editor.getDomNode();
    if (editorElement) {
      editorElement.style.backgroundColor = '#0B0A12';
    }

    // Register language completion providers for all supported languages
    const languages = ['javascript', 'python', 'java', 'cpp', 'c'] as KeywordLanguage[];
    
    languages.forEach((lang) => {
      const keywords = getLanguageKeywords(lang);
      const monacoLanguageId = lang === 'cpp' ? 'cpp' : lang; // Map language correctly
      
      try {
        monacoInstance.languages.registerCompletionItemProvider(monacoLanguageId, {
          provideCompletionItems: (model: any, position: any) => {
            const word = model.getWordUntilPosition(position);
            const range = {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: word.startColumn,
              endColumn: word.endColumn,
            };

            const suggestions = keywords.map((keyword, index) => ({
              label: keyword,
              kind: monacoInstance.languages.CompletionItemKind.Keyword,
              insertText: keyword,
              range: range,
              sortText: `0_${String(index).padStart(3, '0')}_${keyword}`,
              detail: `${lang} keyword`,
              documentation: `${keyword} - ${lang} language keyword`,
            }));

            return { suggestions };
          },
          triggerCharacters: ['.', ' ', '(', '[', '{'],
        });
      } catch (error) {
        console.warn(`Failed to register completion provider for ${lang}:`, error);
        logError(`Failed to register completion provider for ${lang}`);
      }
    });

    editor.addCommand(monacoInstance.KeyCode.F11, () => {
      toggleFullscreen();
    });

    editor.addAction({
      id: "toggle-fullscreen",
      label: "Toggle Fullscreen",
      keybindings: [
        monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyMod.Shift | monacoInstance.KeyCode.KeyF,
      ],
      run: () => {
        toggleFullscreen();
      },
    });

    editor.addAction({
      id: "toggle-settings",
      label: "Toggle Settings",
      keybindings: [monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Comma],
      run: () => {
        setShowSettings(true);
      },
    });

    // Override Ctrl+Z to prevent undo when on starting template
    editor.addCommand(
      monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyZ,
      () => {
        if (isStartingTemplate && isStartingTemplate()) {

          return; // Block the undo operation
        }
        // Allow default undo behavior
        editor.trigger('keyboard', 'undo', null);
      }
    );

    monacoInstance.editor.setTheme(theme);
    setIsEditorReady(true);
  };
};

export const getEditorOptions = (
  _isFullscreen: boolean,
  fontSize: number = 12
) => ({
  minimap: { enabled: false },
  fontSize: fontSize,
  stickyScroll: { enabled: false },
  lineNumbers: "on" as const,
  roundedSelection: false,
  scrollBeyondLastLine: true,
  automaticLayout: true,
  wordWrap: "on" as const,
  padding: { top: 16, bottom: 16 },
  fontFamily: '"SF Mono", Consolas, "Cascadia Code", "Liberation Mono", Menlo, "Courier New", monospace',
  folding: true,
  glyphMargin: true,
  lineDecorationsWidth: 12,
  lineNumbersMinChars: 4,
  tabSize: 4,
  insertSpaces: false,
  detectIndentation: false,
  renderLineHighlight: "line" as const,
  renderWhitespace: "selection" as const,
  smoothScrolling: true,
  cursorBlinking: "blink" as const,
  cursorSmoothCaretAnimation: "on" as const,
  // Enable IntelliSense/Suggestions - MOST IMPORTANT SETTINGS
  quickSuggestions: {
    other: true,
    comments: true,
    strings: true
  },
  acceptSuggestionOnCommitCharacter: true,
  acceptSuggestionOnEnter: "on" as const,
  suggestOnTriggerCharacters: true,
  suggestSelection: "first" as const,
  snippetSuggestions: "top" as const,
  tabCompletion: "on" as const,
  suggest: {
    insertMode: "insert" as const,
    filterGraceful: true,
    localityBonus: true,
    shareSuggestSelections: false,
    snippetsPreventQuickSuggestions: false,
    showIcons: true,
    showMethods: true,
    showFunctions: true,
    showConstructors: true,
    showFields: true,
    showVariables: true,
    showClasses: true,
    showStructs: true,
    showInterfaces: true,
    showModules: true,
    showProperties: true,
    showEvents: true,
    showOperators: true,
    showUnits: true,
    showValues: true,
    showConstants: true,
    showEnums: true,
    showEnumMembers: true,
    showKeywords: true,
    showWords: true,
    showColors: true,
    showFiles: true,
    showReferences: true,
    showFolders: true,
    showTypeParameters: true,
    showSnippets: true,
  },
  // Other helpful settings
  parameterHints: {
    enabled: true,
    cycle: false,
  },
  hover: {
    enabled: true,
    delay: 300,
    sticky: true,
  },
  contextmenu: true,
  formatOnPaste: true,
  formatOnType: true,
  matchBrackets: "always" as const,
  selectionHighlight: true,
  showUnused: true,
  useTabStops: true,
});
