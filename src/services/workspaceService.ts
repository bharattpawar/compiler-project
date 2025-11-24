/**
 * Virtual File System Service
 * 
 * Manages an in-memory file system with localStorage persistence.
 * 
 * LocalStorage Keys Used:
 * - 'vscode-workspace': Main workspace data (files and folders)
 * - 'vscode-open-tabs': Currently open tabs
 * - 'vscode-active-tab': Currently active tab ID
 * - 'vscode-layout': Layout sizes (explorer width, editor height)
 */

export type CompilerLanguage = "c" | "cpp" | "java" | "javascript" | "python";

export interface VFile {
  id: string;
  name: string;
  path: string;
  language: CompilerLanguage;
  content: string;
  isSaved: boolean;
}

export interface VFolder {
  id: string;
  name: string;
  path: string;
  children: Array<VFolder | VFile>;
}

export interface Workspace {
  root: VFolder;
}

export interface OpenTab {
  fileId: string;
  filePath: string;
}

const DEFAULT_CODE: Record<CompilerLanguage, string> = {
  c: `#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}`,
  cpp: `#include <iostream>\r\nusing namespace std;\r\n\r\nint main() {\r\n    cout << "Hello, World!" << endl;\r\n    return 0;\r\n}`,
  java: `public class Main {\r\n    public static void main(String[] args) {\r\n        System.out.println("Hello, World!");\r\n    }\r\n}`,
  javascript: `console.log("Hello, World!");`,
  python: `print("Hello, World!")`,
};

class WorkspaceService {
  private workspace: Workspace;


  constructor() {
    this.workspace = this.loadWorkspace();
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  private getLanguageFromExtension(filename: string): CompilerLanguage {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'c':
        return 'c';
      case 'cpp':
      case 'cc':
      case 'cxx':
        return 'cpp';
      case 'java':
        return 'java';
      case 'js':
      case 'mjs':
        return 'javascript';
      case 'py':
        return 'python';
      default:
        return 'cpp';
    }
  }

  private createDefaultWorkspace(): Workspace {
    const srcFolder: VFolder = {
      id: this.generateId(),
      name: 'src',
      path: '/src',
      children: [
        {
          id: this.generateId(),
          name: 'main.cpp',
          path: '/src/main.cpp',
          language: 'cpp',
          content: DEFAULT_CODE.cpp,
          isSaved: true,
        },
        {
          id: this.generateId(),
          name: 'main.py',
          path: '/src/main.py',
          language: 'python',
          content: DEFAULT_CODE.python,
          isSaved: true,
        },
      ],
    };

    const readmeFile: VFile = {
      id: this.generateId(),
      name: 'README.md',
      path: '/README.md',
      language: 'cpp', // Default for non-code files
      content: '# Welcome to Strike IDE\n\nStart coding by selecting a file from the explorer or creating a new one!',
      isSaved: true,
    };

    return {
      root: {
        id: this.generateId(),
        name: 'workspace',
        path: '/',
        children: [srcFolder, readmeFile],
      },
    };
  }

  private loadWorkspace(): Workspace {
    try {
      const saved = localStorage.getItem('vscode-workspace');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load workspace from localStorage:', error);
    }
    return this.createDefaultWorkspace();
  }

  private saveWorkspace(): void {
    try {
      localStorage.setItem('vscode-workspace', JSON.stringify(this.workspace));
    } catch (error) {
      console.warn('Failed to save workspace to localStorage:', error);
    }
  }

  private findItemByPath(path: string, root: VFolder = this.workspace.root): VFile | VFolder | null {
    if (root.path === path) return root;
    
    for (const child of root.children) {
      if (child.path === path) return child;
      if ('children' in child) {
        const found = this.findItemByPath(path, child);
        if (found) return found;
      }
    }
    return null;
  }

  private findParentFolder(path: string): VFolder | null {
    const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
    const parent = this.findItemByPath(parentPath);
    return parent && 'children' in parent ? parent : null;
  }

  getWorkspace(): Workspace {
    return this.workspace;
  }

  createFile(parentPath: string, name: string, language?: CompilerLanguage): VFile | null {
    const parent = this.findItemByPath(parentPath);
    if (!parent || !('children' in parent)) return null;

    // Check for name collision
    if (parent.children.some(child => child.name === name)) {
      throw new Error(`File "${name}" already exists in this folder`);
    }

    const filePath = parentPath === '/' ? `/${name}` : `${parentPath}/${name}`;
    const fileLanguage = language || this.getLanguageFromExtension(name);
    
    const newFile: VFile = {
      id: this.generateId(),
      name,
      path: filePath,
      language: fileLanguage,
      content: DEFAULT_CODE[fileLanguage] || '',
      isSaved: false,
    };

    parent.children.push(newFile);
    this.saveWorkspace();
    return newFile;
  }

  createFolder(parentPath: string, name: string): VFolder | null {
    const parent = this.findItemByPath(parentPath);
    if (!parent || !('children' in parent)) return null;

    // Check for name collision
    if (parent.children.some(child => child.name === name)) {
      throw new Error(`Folder "${name}" already exists in this folder`);
    }

    const folderPath = parentPath === '/' ? `/${name}` : `${parentPath}/${name}`;
    
    const newFolder: VFolder = {
      id: this.generateId(),
      name,
      path: folderPath,
      children: [],
    };

    parent.children.push(newFolder);
    this.saveWorkspace();
    return newFolder;
  }

  readFile(path: string): VFile | null {
    const item = this.findItemByPath(path);
    return item && !('children' in item) ? item : null;
  }

  writeFile(path: string, content: string): boolean {
    const file = this.readFile(path);
    if (!file) return false;

    file.content = content;
    file.isSaved = true;
    this.saveWorkspace();
    return true;
  }

  markFileUnsaved(path: string): boolean {
    const file = this.readFile(path);
    if (!file) return false;

    file.isSaved = false;
    this.saveWorkspace();
    return true;
  }

  rename(path: string, newName: string): boolean {
    const item = this.findItemByPath(path);
    if (!item) return false;

    const parent = this.findParentFolder(path);
    if (!parent) return false;

    // Check for name collision
    if (parent.children.some(child => child.name === newName && child.path !== path)) {
      throw new Error(`"${newName}" already exists in this folder`);
    }


    const newPath = path.substring(0, path.lastIndexOf('/') + 1) + newName;
    
    item.name = newName;
    item.path = newPath;

    // Update language for files based on new extension
    if (!('children' in item)) {
      (item as VFile).language = this.getLanguageFromExtension(newName);
    }

    this.saveWorkspace();
    return true;
  }

  delete(path: string): boolean {
    const parent = this.findParentFolder(path);
    if (!parent) return false;

    const index = parent.children.findIndex(child => child.path === path);
    if (index === -1) return false;

    parent.children.splice(index, 1);
    this.saveWorkspace();
    return true;
  }

  list(path: string): Array<VFile | VFolder> {
    const folder = this.findItemByPath(path);
    return folder && 'children' in folder ? folder.children : [];
  }

  // Tab management
  getOpenTabs(): OpenTab[] {
    try {
      const saved = localStorage.getItem('vscode-open-tabs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  setOpenTabs(tabs: OpenTab[]): void {
    localStorage.setItem('vscode-open-tabs', JSON.stringify(tabs));
  }

  getActiveTabId(): string | null {
    try {
      return localStorage.getItem('vscode-active-tab');
    } catch {
      return null;
    }
  }

  setActiveTabId(tabId: string | null): void {
    if (tabId) {
      localStorage.setItem('vscode-active-tab', tabId);
    } else {
      localStorage.removeItem('vscode-active-tab');
    }
  }

  // Layout management
  getLayout(): { explorerWidth: number; editorHeight: number } {
    try {
      const saved = localStorage.getItem('vscode-layout');
      return saved ? JSON.parse(saved) : { explorerWidth: 25, editorHeight: 70 };
    } catch {
      return { explorerWidth: 25, editorHeight: 70 };
    }
  }

  setLayout(layout: { explorerWidth: number; editorHeight: number }): void {
    localStorage.setItem('vscode-layout', JSON.stringify(layout));
  }

  hasUnsavedChanges(): boolean {
    const checkUnsaved = (item: VFile | VFolder): boolean => {
      if ('children' in item) {
        return item.children.some(checkUnsaved);
      }
      return !item.isSaved;
    };

    return this.workspace.root.children.some(checkUnsaved);
  }

  // Find node by ID (alternative to path-based search)
  findById(id: string, root: VFolder = this.workspace.root): VFile | VFolder | null {
    if (root.id === id) return root;
    
    for (const child of root.children) {
      if (child.id === id) return child;
      if ('children' in child) {
        const found = this.findById(id, child);
        if (found) return found;
      }
    }
    return null;
  }

  // Get parent of a node by path
  getParent(path: string): VFolder | null {
    return this.findParentFolder(path);
  }

  // Check if path is a folder
  isFolder(path: string): boolean {
    const item = this.findItemByPath(path);
    return item !== null && 'children' in item;
  }

  // Get all files recursively (for search/operations)
  getAllFiles(folder: VFolder = this.workspace.root): VFile[] {
    const files: VFile[] = [];
    
    for (const child of folder.children) {
      if ('children' in child) {
        files.push(...this.getAllFiles(child));
      } else {
        files.push(child);
      }
    }
    
    return files;
  }
}

export const workspaceService = new WorkspaceService();