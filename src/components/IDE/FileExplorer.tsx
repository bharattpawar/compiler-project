import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  FolderPlus, 
  Edit2, 
  Trash2, 
  Copy,
  Folder,
  FolderOpen,
  
  FileCode
} from 'lucide-react';
import { 
  workspaceService, 
  type VFile, 
  type VFolder, 
  type CompilerLanguage 
} from '../../services/workspaceService';
import { getLanguageFromExtension } from '../../utils/fileUtils';
import { showToast } from '../../utils/toast';

// Language-specific icon mapping with colors
const getLanguageIcon = (fileName: string, language?: CompilerLanguage) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  // Map extensions to icons and colors
  const iconMap: Record<string, { icon: React.ReactNode; color: string }> = {
    // JavaScript/TypeScript
    'js': { icon: '📜', color: 'text-yellow-400' },
    'jsx': { icon: '⚛️', color: 'text-cyan-400' },
    'ts': { icon: '📘', color: 'text-blue-500' },
    'tsx': { icon: '⚛️', color: 'text-blue-400' },
    
    // Python
    'py': { icon: '🐍', color: 'text-blue-400' },
    
    // Java
    'java': { icon: '☕', color: 'text-red-500' },
    
    // C/C++
    'c': { icon: '©️', color: 'text-blue-600' },
    'cpp': { icon: '⚙️', color: 'text-purple-500' },
    'cc': { icon: '⚙️', color: 'text-purple-500' },
    'cxx': { icon: '⚙️', color: 'text-purple-500' },
    'h': { icon: '📋', color: 'text-purple-400' },
    'hpp': { icon: '📋', color: 'text-purple-400' },
    
    // Web
    'html': { icon: '🌐', color: 'text-orange-500' },
    'css': { icon: '🎨', color: 'text-blue-400' },
    'scss': { icon: '🎨', color: 'text-pink-400' },
    'sass': { icon: '🎨', color: 'text-pink-500' },
    
    // Data
    'json': { icon: '📊', color: 'text-yellow-500' },
    'xml': { icon: '📄', color: 'text-orange-400' },
    'yaml': { icon: '📝', color: 'text-gray-400' },
    'yml': { icon: '📝', color: 'text-gray-400' },
    
    // Shell
    'sh': { icon: '🐚', color: 'text-green-500' },
    'bash': { icon: '🐚', color: 'text-green-500' },
    
    // Ruby
    'rb': { icon: '💎', color: 'text-red-400' },
    
    // Go
    'go': { icon: '🐹', color: 'text-cyan-500' },
    
    // Rust
    'rs': { icon: '🦀', color: 'text-orange-600' },
    
    // PHP
    'php': { icon: '🐘', color: 'text-purple-600' },
    
    // Markdown
    'md': { icon: '📝', color: 'text-gray-300' },
    'markdown': { icon: '📝', color: 'text-gray-300' },
    
    // Config files
    'env': { icon: '🔐', color: 'text-yellow-300' },
    'config': { icon: '⚙️', color: 'text-gray-400' },
    'ini': { icon: '⚙️', color: 'text-gray-400' },
    
    // Git
    'gitignore': { icon: '🚫', color: 'text-gray-500' },
    
    // Docker
    'dockerfile': { icon: '🐳', color: 'text-blue-500' },
    
    // Default
    'txt': { icon: '📄', color: 'text-gray-400' },
  };
  
  // Check by language first
  if (language) {
    const langMap: Record<CompilerLanguage, { icon: string; color: string }> = {
      'c': { icon: '©️', color: 'text-blue-600' },
      'cpp': { icon: '⚙️', color: 'text-purple-500' },
      'java': { icon: '☕', color: 'text-red-500' },
      'javascript': { icon: '📜', color: 'text-yellow-400' },
      'python': { icon: '🐍', color: 'text-blue-400' },
    };
    
    if (langMap[language]) {
      return langMap[language];
    }
  }
  
  // Check by extension
  if (ext && iconMap[ext]) {
    return iconMap[ext];
  }
  
  // Special file names
  if (fileName.toLowerCase() === 'dockerfile') {
    return { icon: '🐳', color: 'text-blue-500' };
  }
  if (fileName.startsWith('.git')) {
    return { icon: '🚫', color: 'text-gray-500' };
  }
  
  // Default file icon
  return { icon: '📄', color: 'text-gray-400' };
};

interface FileExplorerProps {
  onFileSelect: (file: VFile) => void;
  isVisible: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  target: VFile | VFolder | null;
  onClose: () => void;
  onAction: (action: string, target: VFile | VFolder) => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, target, onClose, onAction }) => {
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

  if (!target) return null;

  const isFolder = 'children' in target;

  return (
    <div
      ref={menuRef}
      className="fixed bg-[#2D2D30] border border-gray-600 rounded-md shadow-lg z-50 py-1 min-w-[160px]"
      style={{ left: x, top: y }}
    >
      {isFolder && (
        <>
          <button
            className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-[#3D3D40] flex items-center gap-2"
            onClick={() => onAction('newFile', target)}
          >
            <Plus className="w-4 h-4" />
            New File
          </button>
          <button
            className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-[#3D3D40] flex items-center gap-2"
            onClick={() => onAction('newFolder', target)}
          >
            <FolderPlus className="w-4 h-4" />
            New Folder
          </button>
          <div className="border-t border-gray-600 my-1" />
        </>
      )}
      <button
        className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-[#3D3D40] flex items-center gap-2"
        onClick={() => onAction('rename', target)}
      >
        <Edit2 className="w-4 h-4" />
        Rename
      </button>
      {!isFolder && (
        <button
          className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-[#3D3D40] flex items-center gap-2"
          onClick={() => onAction('duplicate', target)}
        >
          <Copy className="w-4 h-4" />
          Duplicate
        </button>
      )}
      <div className="border-t border-gray-600 my-1" />
      <button
        className="w-full px-3 py-1.5 text-left text-sm text-red-400 hover:bg-[#3D3D40] flex items-center gap-2"
        onClick={() => onAction('delete', target)}
      >
        <Trash2 className="w-4 h-4" />
        Delete
      </button>
    </div>
  );
};

const FileExplorer: React.FC<FileExplorerProps> = ({ onFileSelect, isVisible }) => {
  const [workspace, setWorkspace] = useState(workspaceService.getWorkspace());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']));
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; target: VFile | VFolder | null } | null>(null);
  const [renamingItem, setRenamingItem] = useState<string | null>(null);
  const [newItemParent, setNewItemParent] = useState<{ path: string; type: 'file' | 'folder' } | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>('/');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const refreshWorkspace = () => {
    setWorkspace(workspaceService.getWorkspace());
  };

  const findItemByPath = (path: string): VFile | VFolder | null => {
    const search = (items: (VFile | VFolder)[]): VFile | VFolder | null => {
      for (const item of items) {
        if (item.path === path) return item;
        if ('children' in item) {
          const found = search(item.children);
          if (found) return found;
        }
      }
      return null;
    };
    return search(workspace.root.children);
  };

  const handleDelete = () => {
    if (!selectedItem) return;
    const item = findItemByPath(selectedItem);
    if (item) {
      const isFolder = 'children' in item;
      const confirmMessage = isFolder 
        ? `Delete folder "${item.name}" and all its contents?`
        : `Delete file "${item.name}"?`;
      if (window.confirm(confirmMessage)) {
        workspaceService.delete(item.path);
        refreshWorkspace();
        setSelectedItem(null);
        showToast.success(`Deleted ${item.name}`);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedItem) {
        e.preventDefault();
        handleDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem]);

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }
      return newExpanded;
    });
  };

  const handleContextMenu = (e: React.MouseEvent, item: VFile | VFolder) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      target: item
    });
  };

  const handleContextAction = (action: string, target: VFile | VFolder) => {
    setContextMenu(null);
    
    try {
      switch (action) {
        case 'newFile': {
          const parentPath = 'children' in target ? target.path : target.path.substring(0, target.path.lastIndexOf('/')) || '/';
          setNewItemParent({ path: parentPath, type: 'file' });
          setSelectedFolder(parentPath);
          if ('children' in target) {
            setExpandedFolders(prev => new Set(prev).add(target.path));
          }
          break;
        }
        case 'newFolder': {
          const folderParentPath = 'children' in target ? target.path : target.path.substring(0, target.path.lastIndexOf('/')) || '/';
          setNewItemParent({ path: folderParentPath, type: 'folder' });
          setSelectedFolder(folderParentPath);
          if ('children' in target) {
            setExpandedFolders(prev => new Set(prev).add(target.path));
          }
          break;
        }
        case 'rename':
          setRenamingItem(target.path);
          break;
        case 'duplicate':
          if (!('children' in target)) {
            const file = target as VFile;
            const baseName = file.name.replace(/\.[^/.]+$/, "");
            const extension = file.name.includes('.') ? '.' + file.name.split('.').pop() : '';
            const newName = `${baseName}_copy${extension}`;
            const parentPath = file.path.substring(0, file.path.lastIndexOf('/')) || '/';
            
            const newFile = workspaceService.createFile(parentPath, newName, file.language);
            if (newFile) {
              workspaceService.writeFile(newFile.path, file.content);
              refreshWorkspace();
              showToast.success(`Duplicated ${file.name}`);
            }
          }
          break;
        case 'delete': {
          const confirmMessage = 'children' in target 
            ? `Delete folder "${target.name}" and all its contents?`
            : `Delete file "${target.name}"?`;
          
          if (window.confirm(confirmMessage)) {
            workspaceService.delete(target.path);
            refreshWorkspace();
            showToast.success(`Deleted ${target.name}`);
          }
          break;
        }
      }
    } catch (error: any) {
      showToast.error(error.message);
    }
  };

  const handleCreateItem = (name: string) => {
    if (!newItemParent || !name.trim()) return;

    try {
      if (newItemParent.type === 'file') {
        // Validate file extension
        const ext = name.split('.').pop()?.toLowerCase();
        const allowedExtensions = ['c', 'cpp', 'cc', 'cxx', 'java', 'js', 'py'];
        
        if (!ext || !allowedExtensions.includes(ext)) {
          showToast.error('Only C++, C, Java, Python, and JavaScript files are allowed');
          setNewItemParent(null);
          return;
        }
        
        const language = getLanguageFromExtension(name);
        const file = workspaceService.createFile(newItemParent.path, name, language);
        if (file) {
          refreshWorkspace();
          onFileSelect(file);
          showToast.success(`Created ${name}`);
        }
      } else {
        workspaceService.createFolder(newItemParent.path, name);
        refreshWorkspace();
        showToast.success(`Created folder ${name}`);
      }
    } catch (error: any) {
      showToast.error(error.message);
    }
    
    setNewItemParent(null);
  };

  const handleRename = (newName: string, path: string) => {
    if (!newName.trim()) return;

    try {
      workspaceService.rename(path, newName);
      refreshWorkspace();
      showToast.success('Renamed successfully');
    } catch (error: any) {
      showToast.error(error.message);
    }
    
    setRenamingItem(null);
  };

  const renderItem = (item: VFile | VFolder, depth: number = 0) => {
    const isFolder = 'children' in item;
    const isExpanded = expandedFolders.has(item.path);
    const isRenaming = renamingItem === item.path;
    const isSelected = selectedItem === item.path;
    
    // Get language-specific icon
    const languageIcon = !isFolder ? getLanguageIcon(item.name, (item as VFile).language) : null;

    return (
      <div key={item.path}>
        <div
          className={`flex items-center py-2 px-2 hover:bg-gray-800 cursor-pointer text-sm transition-colors rounded-md mx-1 ${
            isSelected ? 'bg-gray-900 shadow-[inset_3px_0_0_#FFCC00]' : ''
          }`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => {
            setSelectedItem(item.path);
            if (isFolder) {
              toggleFolder(item.path);
              setSelectedFolder(item.path);
            } else {
              onFileSelect(item as VFile);
            }
          }}
          onContextMenu={(e) => handleContextMenu(e, item)}
        >
          {/* Expand/Collapse Arrow */}
          {isFolder && (
            <button
              className="mr-1 p-0.5 hover:bg-gray-700 rounded flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(item.path);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-gray-400" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-400" />
              )}
            </button>
          )}
          
          {/* Icon */}
          <span className="mr-2 flex-shrink-0 text-base leading-none">
            {isFolder ? (
              isExpanded ? 
                <FolderOpen className="w-4 h-4 text-blue-400" /> : 
                <Folder className="w-4 h-4 text-blue-400" />
            ) : (
              <>
                <img 
                  src={(() => {
                    const ext = item.name.includes('.') ? item.name.split('.').pop()?.toLowerCase() : '';
                    const map: Record<string, string> = { cpp: 'cplusplus', cc: 'cplusplus', c: 'c', java: 'java', js: 'javascript', jsx: 'react', ts: 'typescript', tsx: 'react', py: 'python', html: 'html5', css: 'css3' };
                    const icon = ext && map[ext] ? map[ext] : 'text';
                    return `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${icon}/${icon}-original.svg`;
                  })()} 
                  alt={item.name.split('.').pop() || 'file'} 
                  className="w-4 h-4"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <span className={`${languageIcon?.color} hidden`} title={(item as VFile).language}>
                  {languageIcon?.icon}
                </span>
              </>
            )}
          </span>
          
          {/* Name or Rename Input */}
          {isRenaming ? (
            <input
              type="text"
              defaultValue={item.name}
              className="bg-gray-800 text-white px-1 py-0.5 text-sm rounded flex-1 outline-none focus:ring-1 focus:ring-gray-600"
              autoFocus
              onBlur={(e) => handleRename(e.target.value, item.path)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRename(e.currentTarget.value, item.path);
                } else if (e.key === 'Escape') {
                  setRenamingItem(null);
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="text-gray-200 flex-1 truncate">
              {item.name}
            </span>
          )}
          
          {/* Unsaved Indicator */}
          {!isFolder && !(item as VFile).isSaved && (
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 ml-2 flex-shrink-0" title="Unsaved changes" />
          )}
        </div>

        {/* Children and New Item Input */}
        {isFolder && isExpanded && (
          <>
            {item.children.map(child => renderItem(child, depth + 1))}
            {newItemParent?.path === item.path && (
              <div
                className="flex items-center py-1 px-2 text-sm w-full"
                style={{ paddingLeft: `${24 + depth * 16}px` }}
              >
                <span className="mr-2 flex-shrink-0">
                  {newItemParent.type === 'folder' ? 
                    <FolderPlus className="w-4 h-4 text-blue-400" /> : 
                    <FileCode className="w-4 h-4 text-gray-400" />
                  }
                </span>
                <input
                  type="text"
                  placeholder={newItemParent.type === 'file' ? 'filename.ext' : 'folder name'}
                  className="bg-gray-800 text-white px-1 py-0.5 text-sm rounded outline-none focus:ring-1 focus:ring-gray-600 min-w-0"
                  style={{ width: `calc(100% - ${40 + depth * 16}px)` }}
                  autoFocus
                  onBlur={(e) => {
                    if (e.target.value.trim()) {
                      handleCreateItem(e.target.value);
                    } else {
                      setNewItemParent(null);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateItem(e.currentTarget.value);
                    } else if (e.key === 'Escape') {
                      setNewItemParent(null);
                    }
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="bg-black flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="h-8 px-2 md:px-3 border-b border-gray-800 flex items-center justify-between">
          <span className="text-xs md:text-xs font-semibold text-gray-300 uppercase tracking-wide">
            Explorer
          </span>
          <div className="flex gap-1 md:gap-1">
            <button
              className="p-1 hover:bg-gray-800 rounded transition-colors"
              onClick={() => {
                setNewItemParent({ path: selectedFolder, type: 'file' });
                setExpandedFolders(prev => new Set(prev).add(selectedFolder));
              }}
              title="New File in Selected Folder"
            >
              <Plus className="w-4 h-4 text-gray-400" />
            </button>
            <button
              className="p-1 hover:bg-gray-800 rounded transition-colors"
              onClick={() => {
                setNewItemParent({ path: selectedFolder, type: 'folder' });
                setExpandedFolders(prev => new Set(prev).add(selectedFolder));
              }}
              title="New Folder in Selected Folder"
            >
              <FolderPlus className="w-4 h-4 text-gray-400" />
            </button>
            <button
              className="p-1 hover:bg-gray-800 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              onClick={handleDelete}
              disabled={!selectedItem}
              title="Delete Selected Item (Del)"
            >
              <Trash2 className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Current Context Indicator */}
        <div className="px-2 md:px-3 py-1.5 bg-black border-b border-gray-800">
          <span className="text-xs md:text-xs text-gray-500">
            Create in: <span className="text-gray-400">{selectedFolder === '/' ? 'Root' : selectedFolder.split('/').pop()}</span>
          </span>
        </div>

        {/* File Tree */}
        <div 
          className="flex-1 overflow-auto"
          onClick={(e) => {
            // Reset to root if clicking empty space
            if (e.target === e.currentTarget) {
              setSelectedFolder('/');
              setSelectedItem(null);
            }
          }}
        >
          {workspace.root.children.map(item => renderItem(item))}
          
          {/* Root Level New Item */}
          {newItemParent?.path === '/' && (
            <div className="flex items-center py-1 px-2 text-sm w-full" style={{ paddingLeft: '8px' }}>
              <span className="mr-2 flex-shrink-0">
                {newItemParent.type === 'folder' ? 
                  <FolderPlus className="w-4 h-4 text-blue-400" /> : 
                  <FileCode className="w-4 h-4 text-gray-400" />
                }
              </span>
              <input
                type="text"
                placeholder={newItemParent.type === 'file' ? 'filename.ext' : 'folder name'}
                className="bg-gray-800 text-white px-1 py-0.5 text-sm rounded outline-none focus:ring-1 focus:ring-gray-600 min-w-0"
                style={{ width: 'calc(100% - 40px)' }}
                autoFocus
                onBlur={(e) => {
                  if (e.target.value.trim()) {
                    handleCreateItem(e.target.value);
                  } else {
                    setNewItemParent(null);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateItem(e.currentTarget.value);
                  } else if (e.key === 'Escape') {
                    setNewItemParent(null);
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          target={contextMenu.target}
          onClose={() => setContextMenu(null)}
          onAction={handleContextAction}
        />
      )}
    </>
  );
};

export default FileExplorer;
