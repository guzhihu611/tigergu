import { clearRendererCache } from '../src/core/renderer.js';
import { commit } from './history.js';
import store from '../src/core/store.js';

const TigerTabManager = {
  _canvases: [],
  _activeId: null,

  init(projectData) {
    this._canvases = projectData.canvases || [];
    
    if (this._canvases.length === 0) {
      const defaultCanvasId = 'canvas_default_' + Date.now();
      this._canvases.push({
        id: defaultCanvasId,
        name: '默认画布',
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1.1 }
      });
      this._activeId = defaultCanvasId;
      store.hydrate(this._canvases[0]);
    } else {
      this._activeId = projectData.activeCanvasId || (this._canvases[0]?.id ?? null);
      const activeCanvas = this._canvases.find(canvas => canvas.id === this._activeId) || this._canvases[0];
      if (activeCanvas) {
        store.hydrate(activeCanvas);
      }
    }
    
    this.renderTabs();
  },

  _flushCurrentCanvas() {
    if (!this._activeId) {
      return;
    }
    
    const activeCanvasIndex = this._canvases.findIndex(canvas => canvas.id === this._activeId);
    if (activeCanvasIndex === -1) {
      return;
    }
    
    const currentState = store.getState();
    this._canvases[activeCanvasIndex] = {
      ...this._canvases[activeCanvasIndex],
      nodes: currentState.nodes,
      edges: currentState.edges,
      viewport: currentState.viewport,
      assets: currentState.assets || []
    };
  },

  async switchTo(canvasId) {
    if (canvasId === this._activeId) {
      return;
    }
    
    this._flushCurrentCanvas();
    clearRendererCache();
    
    const v2NodeContainer = document.getElementById('v2NodeContainer');
    if (v2NodeContainer) {
      Array.from(v2NodeContainer.children).forEach(child => {
        if (child.classList.contains('v2-node')) {
          child.remove();
        }
      });
    }
    
    this._activeId = canvasId;
    const canvas = this._canvases.find(c => c.id === canvasId);
    if (canvas) {
      store.hydrate(canvas);
    }
    
    commit();
    this.renderTabs();
  },

  addCanvas() {
    this._flushCurrentCanvas();
    clearRendererCache();
    
    const v2NodeContainer = document.getElementById('v2NodeContainer');
    if (v2NodeContainer) {
      Array.from(v2NodeContainer.children).forEach(child => {
        if (child.classList.contains('v2-node')) {
          child.remove();
        }
      });
    }
    
    const canvasId = 'canvas_' + Date.now();
    const canvasName = '画布 ' + (this._canvases.length + 1);
    
    this._canvases.push({
      id: canvasId,
      name: canvasName,
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1.1 }
    });
    
    this._activeId = canvasId;
    store.hydrate({ nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1.1 } });
    commit();
    this.renderTabs();
  },

  deleteCanvas(canvasId) {
    if (this._canvases.length <= 1) {
      window.showToast('至少保留一个画布页面', 'warn');
      return;
    }
    
    const canvas = this._canvases.find(c => c.id === canvasId);
    const canvasName = canvas?.name || '画布';
    if (!window.confirm(`确定要删除"${canvasName}"吗？删除后无法恢复。`)) {
      return;
    }
    
    const canvasIndex = this._canvases.findIndex(canvas => canvas.id === canvasId);
    if (canvasIndex === -1) {
      return;
    }
    
    this._canvases.splice(canvasIndex, 1);
    
    if (this._activeId === canvasId) {
      const newActiveCanvas = this._canvases[Math.max(0, canvasIndex - 1)];
      this._activeId = newActiveCanvas.id;
      clearRendererCache();
      
      const v2NodeContainer = document.getElementById('v2NodeContainer');
      if (v2NodeContainer) {
        Array.from(v2NodeContainer.children).forEach(child => {
          if (child.classList.contains('v2-node')) {
            child.remove();
          }
        });
      }
      
      store.hydrate(newActiveCanvas);
      commit();
    }
    
    this.renderTabs();
  },

  renameCanvas(canvasId, newName) {
    const canvas = this._canvases.find(c => c.id === canvasId);
    if (canvas) {
      canvas.name = newName.trim() || canvas.name;
    }
    
    window._triggerLocalCacheSave?.();
  },

  getMultiData() {
    this._flushCurrentCanvas();
    return {
      canvases: this._canvases,
      activeCanvasId: this._activeId
    };
  },

  renderTabs() {
    const canvasTabs = document.getElementById('canvasTabs');
    if (!canvasTabs) {
      return;
    }
    
    canvasTabs.replaceChildren();
    
    this._canvases.forEach(canvas => {
      const isActive = canvas.id === this._activeId;
      const tabElement = document.createElement('div');
      tabElement.className = 'canvas-tab' + (isActive ? ' active' : '');
      tabElement.dataset.id = canvas.id;
      
      const tabName = document.createElement('span');
      tabName.className = 'canvas-tab-name';
      tabName.textContent = canvas.name;
      tabName.title = canvas.name;
      
      const closeButton = document.createElement('button');
      closeButton.type = 'button';
      closeButton.className = 'canvas-tab-close';
      closeButton.dataset.id = canvas.id;
      closeButton.textContent = '×';
      
      tabElement.appendChild(tabName);
      tabElement.appendChild(closeButton);
      
      tabElement.addEventListener('click', (event) => {
        if (event.target.closest('.canvas-tab-close')) {
          return;
        }
        
        if (isActive) {
          tabName.contentEditable = true;
          tabName.focus();
          
          const selection = document.getSelection();
          const range = document.createRange();
          range.selectNodeContents(tabName);
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          this.switchTo(canvas.id);
        }
      });
      
      tabName.addEventListener('blur', () => {
        tabName.contentEditable = false;
        this.renameCanvas(canvas.id, tabName.textContent);
        tabName.title = this._canvases.find(c => c.id === canvas.id)?.name || tabName.textContent;
        this.renderTabs();
      });
      
      tabName.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          tabName.blur();
        } else if (event.key === 'Escape') {
          tabName.textContent = canvas.name;
          tabName.blur();
        }
      });
      
      closeButton.addEventListener('click', (event) => {
        event.stopPropagation();
        this.deleteCanvas(canvas.id);
      });
      
      tabElement.addEventListener('auxclick', (event) => {
        if (event.button === 1) {
          event.preventDefault();
          event.stopPropagation();
          this.deleteCanvas(canvas.id);
        }
      });
      
      tabElement.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        event.stopPropagation();
        
        const showContextMenu = () => {
          let existingMenu = document.getElementById('tab-context-menu');
          if (existingMenu) {
            existingMenu.remove();
          }
          
          const contextMenu = document.createElement('div');
          contextMenu.id = 'tab-context-menu';
          contextMenu.className = 'v2-dropdown-menu open';
          contextMenu.style.position = 'fixed';
          contextMenu.style.left = event.clientX + 'px';
          contextMenu.style.top = event.clientY + 'px';
          contextMenu.style.zIndex = 9999;
          contextMenu.style.background = 'var(--bg)';
          
          const svgNamespace = 'http://www.w3.org/2000/svg';
          
          const createIcon = () => {
            const icon = document.createElementNS(svgNamespace, 'svg');
            icon.setAttribute('width', '14');
            icon.setAttribute('height', '14');
            icon.setAttribute('viewBox', '0 0 24 24');
            icon.setAttribute('stroke', 'none');
            icon.setAttribute('stroke-width', '2');
            icon.setAttribute('stroke-linecap', 'round');
            icon.setAttribute('stroke-linejoin', 'round');
            return icon;
          };
          
          const saveIcon = (() => {
            const icon = createIcon();
            const path = document.createElementNS(svgNamespace, 'path');
            path.setAttribute('d', 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z');
            
            const line1 = document.createElementNS(svgNamespace, 'polyline');
            line1.setAttribute('points', '14 2 14 8 20 8');
            
            const line2 = document.createElementNS(svgNamespace, 'line');
            line2.setAttribute('x1', '12');
            line2.setAttribute('y1', '18');
            line2.setAttribute('x2', '12');
            line2.setAttribute('y2', '12');
            
            const line3 = document.createElementNS(svgNamespace, 'line');
            line3.setAttribute('x1', '9');
            line3.setAttribute('y1', '15');
            line3.setAttribute('x2', '15');
            line3.setAttribute('y2', '15');
            
            icon.appendChild(path);
            icon.appendChild(line1);
            icon.appendChild(line2);
            icon.appendChild(line3);
            return icon;
          })();
          
          const exportIcon = (() => {
            const icon = createIcon();
            const path = document.createElementNS(svgNamespace, 'path');
            path.setAttribute('d', 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z');
            
            const line = document.createElementNS(svgNamespace, 'polyline');
            line.setAttribute('points', '14 2 14 8 20 8');
            
            icon.appendChild(path);
            icon.appendChild(line);
            return icon;
          })();
          
          const deleteIcon = (() => {
            const icon = createIcon();
            const line1 = document.createElementNS(svgNamespace, 'polyline');
            line1.setAttribute('points', '3 6 5 6 21 6');
            
            const path = document.createElementNS(svgNamespace, 'path');
            path.setAttribute('d', 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2');
            
            icon.appendChild(line1);
            icon.appendChild(path);
            return icon;
          })();
          
          const createMenuItem = (label, icon, callback, isDanger = false) => {
            const menuItem = document.createElement('div');
            menuItem.className = 'v2-menu-row';
            
            const iconContainer = document.createElement('span');
            iconContainer.className = 'v2-menu-icon';
            iconContainer.appendChild(icon);
            
            const textContainer = document.createElement('span');
            textContainer.className = 'v2-menu-text';
            textContainer.textContent = label;
            
            menuItem.appendChild(iconContainer);
            menuItem.appendChild(textContainer);
            
            if (isDanger) {
              menuItem.style.color = 'var(--red)';
            }
            
            menuItem.addEventListener('click', (event) => {
              event.stopPropagation();
              contextMenu.remove();
              callback();
            });
            
            menuItem.addEventListener('contextmenu', (event) => {
              event.preventDefault();
            });
            
            return menuItem;
          };
          
          createMenuItem('保存', saveIcon, () => {
            if (window.saveProject) {
              window.saveProject(canvas.name);
            }
          });
          
          createMenuItem('另存为...', exportIcon, () => {
            const currentState = store.getState();
            const canvasData = {
              projectName: canvas.name,
              nodes: currentState.nodes || [],
              edges: currentState.edges || [],
              viewport: currentState.viewport || { x: 0, y: 0, zoom: 1 }
            };
            
            const blob = new Blob([JSON.stringify(canvasData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = canvas.name + '.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            window.showToast?.('工作流已下载：' + canvas.name + '.json');
          });
          
          const separator = document.createElement('div');
          separator.className = 'v2-menu-sep';
          contextMenu.appendChild(separator);
          
          createMenuItem('删除', deleteIcon, () => {
            this.deleteCanvas(canvas.id);
          }, true);
          
          document.body.appendChild(contextMenu);
          
          const handleClickOutside = (event) => {
            if (!contextMenu.contains(event.target)) {
              contextMenu.remove();
              document.removeEventListener('pointerdown', handleClickOutside, true);
            }
          };
          
          requestAnimationFrame(() => {
            document.addEventListener('pointerdown', handleClickOutside, true);
          });
        };
        
        if (!isActive) {
          this.switchTo(canvas.id).then(showContextMenu);
        } else {
          showContextMenu();
        }
      });
      
      canvasTabs.appendChild(tabElement);
    });
  }
};

export default TigerTabManager;
export { TigerTabManager };