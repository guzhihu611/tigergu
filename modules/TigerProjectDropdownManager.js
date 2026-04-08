import ProjectManager from './ProjectManager.js';
import * as projectModule from './project.js';

const TigerProjectDropdownManager = {
  init() {
    this.setupEventListeners();
  },

  setupEventListeners() {
    const projectDropdown = document.getElementById('projectDropdown');
    const projectDropdownMenu = document.getElementById('projectDropdownMenu');
    const projectNameText = document.getElementById('projectNameText');
    
    if (projectDropdown && projectDropdownMenu) {
      projectDropdown.addEventListener('click', (event) => {
        event.stopPropagation();
        this.toggleDropdown();
      });
      
      projectNameText.addEventListener('click', (event) => {
        event.stopPropagation();
        this.toggleDropdown();
      });
      
      document.addEventListener('click', () => {
        this.closeDropdown();
      });
      
      projectDropdownMenu.addEventListener('click', (event) => {
        event.stopPropagation();
      });
      
      this.setupDropdownItems();
    }
  },

  toggleDropdown() {
    const projectDropdownMenu = document.getElementById('projectDropdownMenu');
    if (projectDropdownMenu) {
      projectDropdownMenu.classList.toggle('show');
    }
  },

  closeDropdown() {
    const projectDropdownMenu = document.getElementById('projectDropdownMenu');
    if (projectDropdownMenu && projectDropdownMenu.classList.contains('show')) {
      projectDropdownMenu.classList.remove('show');
    }
  },

  setupDropdownItems() {
    const projectDropdownMenu = document.getElementById('projectDropdownMenu');
    if (!projectDropdownMenu) {
      return;
    }
    
    projectDropdownMenu.innerHTML = `
      <div class="dropdown-item" data-action="new">
        <span class="dropdown-icon">+</span>
        <span class="dropdown-text">新建项目</span>
      </div>
      <div class="dropdown-item" data-action="save">
        <span class="dropdown-icon">💾</span>
        <span class="dropdown-text">保存项目</span>
      </div>
      <div class="dropdown-item" data-action="gallery">
        <span class="dropdown-icon">🖼️</span>
        <span class="dropdown-text">项目画廊</span>
      </div>
      <div class="dropdown-divider"></div>
      <div class="dropdown-item" data-action="export">
        <span class="dropdown-icon">📤</span>
        <span class="dropdown-text">导出项目</span>
      </div>
      <div class="dropdown-item" data-action="import">
        <span class="dropdown-icon">📥</span>
        <span class="dropdown-text">导入项目</span>
      </div>
    `;
    
    const dropdownItems = projectDropdownMenu.querySelectorAll('.dropdown-item');
    dropdownItems.forEach(item => {
      item.addEventListener('click', (event) => {
        event.stopPropagation();
        const action = item.dataset.action;
        this.handleDropdownAction(action);
        this.closeDropdown();
      });
    });
  },

  async handleDropdownAction(action) {
    try {
      switch (action) {
        case 'new':
          await this.createNewProject();
          break;
        case 'save':
          await this.saveProject();
          break;
        case 'gallery':
          this.showProjectGallery();
          break;
        case 'export':
          this.exportProject();
          break;
        case 'import':
          this.importProject();
          break;
        default:
          console.warn('Unknown dropdown action:', action);
          break;
      }
    } catch (error) {
      console.error('Error handling dropdown action:', error);
      window.showToast('操作失败，请重试', 'error');
    }
  },

  async createNewProject() {
    try {
      const projectId = await ProjectManager.createProject();
      if (projectId) {
        if (window.store) {
          window.store.hydrate({});
        }
        await ProjectManager.loadProject(projectId);
        window.showToast('新项目创建成功', 'success');
      }
    } catch (error) {
      console.error('Error creating new project:', error);
      throw error;
    }
  },

  async saveProject() {
    try {
      if (window.currentProjectId) {
        await ProjectManager.saveCurrentProject();
        window.showToast('项目保存成功', 'success');
      } else {
        await this.createNewProject();
      }
    } catch (error) {
      console.error('Error saving project:', error);
      throw error;
    }
  },

  showProjectGallery() {
    ProjectManager.showGallery();
  },

  exportProject() {
    try {
      if (window.currentProjectId && window.TigerTabManager) {
        window.TigerTabManager._flushCurrentCanvas();
        const projectData = window.TigerTabManager.getMultiData();
        
        const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'project_' + Date.now() + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        window.showToast('项目导出成功', 'success');
      } else {
        window.showToast('没有可导出的项目', 'warn');
      }
    } catch (error) {
      console.error('Error exporting project:', error);
      throw error;
    }
  },

  importProject() {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const projectData = JSON.parse(e.target.result);
              if (projectData.canvases && Array.isArray(projectData.canvases)) {
                const projectId = await ProjectManager.createProject('导入的项目');
                if (projectId) {
                  window.currentProjectId = projectId;
                  await projectModule.saveProject(projectId, projectData);
                  await ProjectManager.loadProject(projectId);
                  
                  window.showToast('项目导入成功', 'success');
                }
              } else {
                window.showToast('无效的项目文件', 'error');
              }
            } catch (error) {
              console.error('Error parsing project file:', error);
              window.showToast('文件解析失败', 'error');
            }
          };
          reader.readAsText(file);
        }
      });
      
      input.click();
    } catch (error) {
      console.error('Error importing project:', error);
      window.showToast('导入项目失败', 'error');
    }
  }
};

export default TigerProjectDropdownManager;
export { TigerProjectDropdownManager };