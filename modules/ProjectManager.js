import { generateId } from '../src/core/math.js';
import * as projectModule from './project.js';
import TigerTabManager from './TigerTabManager.js';
import { getProjects, createProject, deleteProject } from '../api/index.js';
import { clearRendererCache } from '../src/core/renderer.js';
import { commit } from './history.js';

window.TigerTabManager = TigerTabManager;

const projectGallery = document.getElementById('projectGallery');
const projectGrid = document.getElementById('projectGrid');

const ProjectManager = {
  async getProjects() {
    return await getProjects();
  },

  async createProject(name) {
    if (!name) {
      const date = new Date();
      name = '画板 ' + date.toLocaleString();
    }
    const id = generateId(10);
    return await createProject(id, name);
  },

  async loadProject(projectId) {
    try {
      clearRendererCache();
      const projectData = await projectModule.loadProject(projectId);
      window.currentProjectId = projectId;
      
      if (projectGallery) {
        projectGallery.classList.remove('hidden');
      }
      
      document.body.classList.remove('in-gallery');
      localStorage.setItem('tapnow_last_project_v2', projectId);
      
      try {
        if (window.TigerTabManager?.init) {
          window.TigerTabManager.init(projectData);
        } else {
          console.warn('TigerTabManager or init method not available, using fallback hydration');
          if (projectData.canvases && projectData.canvases.length > 0) {
            const activeCanvas = projectData.canvases.find(c => c.id === projectData.activeCanvasId) || projectData.canvases[0];
            if (activeCanvas && window.store) {
              window.store.hydrate(activeCanvas);
            }
          } else if (window.store) {
            window.store.hydrate({});
          }
        }
      } catch (tabError) {
        console.error('TigerTabManager.init failed, using fallback hydration:', tabError);
        try {
          if (projectData.canvases && projectData.canvases.length > 0) {
            const activeCanvas = projectData.canvases.find(c => c.id === projectData.activeCanvasId) || projectData.canvases[0];
            if (activeCanvas && window.store) {
              window.store.hydrate(activeCanvas);
            }
          } else if (window.store) {
            window.store.hydrate({});
          }
        } catch (hydrateError) {
          console.error('Fallback hydration also failed:', hydrateError);
        }
      }
      
      const projectNameText = document.getElementById('projectNameText');
      if (projectNameText) {
        const projects = await this.getProjects();
        const project = projects.find(p => p.id === projectId);
        const projectName = project?.name || '未命名项目';
        projectNameText.textContent = projectName;
      }
    } catch (error) {
      console.error('Failed to load project:', error);
      alert('读取项目失败');
    }
  },

  async saveCurrentProject() {
    if (!window.currentProjectId) {
      return;
    }
    
    if (window.TigerTabManager) {
      window.TigerTabManager._flushCurrentCanvas?.();
      const multiData = window.TigerTabManager.getMultiData?.();
      if (multiData) {
        await projectModule.saveProject(window.currentProjectId, multiData);
      }
    }
  },

  showConfirm(title, message, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'custom-confirm-overlay';
    
    const confirmBox = document.createElement('div');
    confirmBox.className = 'custom-confirm-box';
    Object.assign(confirmBox.style, {
      background: 'var(--surface-quote)',
      color: 'var(--text-primary)',
      padding: '20px',
      borderRadius: '8px',
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: '9999',
      border: '1px solid var(--white-10)'
    });
    
    const titleElement = document.createElement('div');
    titleElement.className = 'confirm-title';
    Object.assign(titleElement.style, {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '10px'
    });
    titleElement.textContent = title;
    
    const messageElement = document.createElement('div');
    messageElement.className = 'confirm-msg';
    Object.assign(messageElement.style, {
      marginBottom: '20px',
      color: 'var(--text-muted)'
    });
    messageElement.textContent = message;
    
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'confirm-btns';
    Object.assign(buttonsContainer.style, {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px'
    });
    
    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'confirm-btn confirm-cancel';
    Object.assign(cancelButton.style, {
      padding: '6px 12px',
      borderRadius: '4px',
      border: 'none',
      background: 'var(--bg)',
      color: 'white',
      cursor: 'pointer'
    });
    cancelButton.textContent = '取消';
    
    const confirmButton = document.createElement('button');
    confirmButton.type = 'button';
    confirmButton.className = 'confirm-btn confirm-ok';
    Object.assign(confirmButton.style, {
      padding: '6px 12px',
      borderRadius: '4px',
      border: 'none',
      background: 'var(--red)',
      color: 'var(--text-primary)',
      cursor: 'pointer'
    });
    confirmButton.textContent = '确认删除';
    
    buttonsContainer.appendChild(cancelButton);
    buttonsContainer.appendChild(confirmButton);
    confirmBox.appendChild(titleElement);
    confirmBox.appendChild(messageElement);
    confirmBox.appendChild(buttonsContainer);
    overlay.appendChild(confirmBox);
    document.body.appendChild(overlay);
    
    const closeConfirm = () => overlay.remove();
    
    cancelButton.onclick = closeConfirm;
    confirmButton.onclick = () => {
      onConfirm();
      closeConfirm();
    };
    
    overlay.onclick = (event) => {
      if (event.target === overlay) {
        closeConfirm();
      }
    };
  },

  async deleteProject(projectId) {
    this.showConfirm('确认删除', '删除后项目将无法恢复，确定要继续吗？', async () => {
      try {
        await deleteProject(projectId);
        if (window.currentProjectId === projectId) {
          this.showGallery();
        } else {
          this.renderGallery();
        }
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    });
  },

  showGallery() {
    window.currentProjectId = null;
    if (projectGallery) {
      projectGallery.classList.remove('hidden');
    }
    document.body.classList.add('in-gallery');
    this.renderGallery();
  },

  async renderGallery() {
    if (!projectGrid) {
      return;
    }
    
    const projects = await this.getProjects();
    projectGrid.replaceChildren();
    
    const newProjectCard = document.createElement('div');
    newProjectCard.className = 'project-card new-project-card';
    
    const svgNamespace = 'http://www.w3.org/2000/svg';
    const newProjectPreview = document.createElement('div');
    newProjectPreview.className = 'pc-preview new-project-preview';
    Object.assign(newProjectPreview.style, {
      background: 'var(--white-02)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    });
    
    const plusIcon = document.createElementNS(svgNamespace, 'svg');
    plusIcon.setAttribute('width', '32');
    plusIcon.setAttribute('height', '32');
    plusIcon.setAttribute('viewBox', '0 0 24 24');
    plusIcon.setAttribute('stroke', 'none');
    plusIcon.setAttribute('stroke-width', '2');
    plusIcon.setAttribute('stroke-linecap', 'round');
    plusIcon.setAttribute('stroke-linejoin', 'round');
    plusIcon.style.color = 'currentColor';
    
    const line1 = document.createElementNS(svgNamespace, 'line');
    line1.setAttribute('x1', '12');
    line1.setAttribute('y1', '5');
    line1.setAttribute('x2', '12');
    line1.setAttribute('y2', '19');
    
    const line2 = document.createElementNS(svgNamespace, 'line');
    line2.setAttribute('x1', '5');
    line2.setAttribute('y1', '12');
    line2.setAttribute('x2', '19');
    line2.setAttribute('y2', '12');
    
    plusIcon.appendChild(line1);
    plusIcon.appendChild(line2);
    newProjectPreview.appendChild(plusIcon);
    
    const newProjectInfo = document.createElement('div');
    newProjectInfo.className = 'pc-info';
    Object.assign(newProjectInfo.style, {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '60px',
      padding: '16px 0'
    });
    
    const newProjectTitle = document.createElement('div');
    newProjectTitle.className = 'pc-title';
    Object.assign(newProjectTitle.style, {
      color: 'var(--text-primary)',
      fontSize: '14px',
      fontWeight: '600',
      textAlign: 'center',
      margin: '0'
    });
    newProjectTitle.textContent = '新建项目';
    
    newProjectInfo.appendChild(newProjectTitle);
    newProjectCard.appendChild(newProjectPreview);
    newProjectCard.appendChild(newProjectInfo);
    
    const styleElement = document.createElement('style');
    styleElement.textContent = '@keyframes spin { 100% { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }';
    document.head.appendChild(styleElement);
    
    window.showGlobalLoading = function(message = '加载中...') {
      let loadingElement = document.getElementById('v2-global-loading');
      if (!loadingElement) {
        loadingElement = document.createElement('div');
        loadingElement.id = 'v2-global-loading';
        Object.assign(loadingElement.style, {
          position: 'fixed',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--bg)',
          color: 'var(--text-primary)',
          padding: '10px 24px',
          borderRadius: '30px',
          fontSize: '14px',
          zIndex: '99999',
          border: '1px solid var(--white-10)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 8px 32px var(--black-50)',
          opacity: '0',
          transition: 'opacity 0.2s',
          pointerEvents: 'none'
        });
        
        const spinner = document.createElementNS(svgNamespace, 'svg');
        spinner.setAttribute('width', '18');
        spinner.setAttribute('height', '18');
        spinner.setAttribute('viewBox', '0 0 24 24');
        spinner.setAttribute('stroke', 'none');
        spinner.setAttribute('stroke-width', '2');
        spinner.classList.add('spin');
        
        const path = document.createElementNS(svgNamespace, 'path');
        path.setAttribute('d', 'M21 12a9 9 0 1 1-6.219-8.56');
        spinner.appendChild(path);
        
        const textElement = document.createElement('span');
        loadingElement.appendChild(spinner);
        loadingElement.appendChild(textElement);
        document.body.appendChild(loadingElement);
      }
      
      loadingElement.querySelector('span').textContent = message;
      void loadingElement.offsetWidth;
      loadingElement.style.opacity = '1';
    };
    
    window.hideGlobalLoading = function() {
      const loadingElement = document.getElementById('v2-global-loading');
      if (loadingElement) {
        loadingElement.style.opacity = '0';
        setTimeout(() => loadingElement.remove(), 250);
      }
    };
    
    newProjectCard.onclick = async () => {
      const projectId = await this.createProject();
      if (projectId) {
        if (window.store) {
          window.store.hydrate({});
        }
        await this.loadProject(projectId);
        commit();
      }
    };
    
    projectGrid.appendChild(newProjectCard);
    
    projects.sort((a, b) => b.lastModified - a.lastModified).forEach(project => {
      const projectCard = document.createElement('div');
      projectCard.className = 'project-card';
      
      const lastModified = new Date(project.lastModified).toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const previewElement = document.createElement('div');
      previewElement.className = 'pc-preview';
      
      if (project.thumbnail && project.thumbnail.type === 'image' && project.thumbnail.data) {
        const img = document.createElement('img');
        img.src = project.thumbnail.data;
        previewElement.appendChild(img);
      } else if (project.thumbnail && project.thumbnail.type === 'text' && project.thumbnail.data) {
        const textSnippet = document.createElement('div');
        textSnippet.className = 'pc-text-snippet';
        textSnippet.textContent = project.thumbnail.data;
        previewElement.appendChild(textSnippet);
      } else {
        const defaultPreview = document.createElement('div');
        defaultPreview.className = 'pc-logo';
        Object.assign(defaultPreview.style, {
          fontWeight: 'bold',
          color: 'var(--red)',
          fontSize: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60px'
        });
        defaultPreview.textContent = 'AITiger';
        previewElement.appendChild(defaultPreview);
      }
      
      const projectInfo = document.createElement('div');
      projectInfo.className = 'pc-info';
      
      const projectName = document.createElement('div');
      projectName.className = 'pc-title';
      projectName.textContent = project.name;
      
      const projectMeta = document.createElement('div');
      projectMeta.className = 'pc-meta';
      
      const timeElement = document.createElement('span');
      timeElement.className = 'pc-time';
      timeElement.textContent = lastModified;
      
      const deleteElement = document.createElement('span');
      deleteElement.className = 'pc-delete';
      deleteElement.dataset.id = project.id;
      Object.assign(deleteElement.style, {
        color: 'var(--text-muted)',
        cursor: 'pointer',
        transition: 'color 0.2s'
      });
      deleteElement.textContent = '删除';
      
      deleteElement.addEventListener('mouseenter', () => deleteElement.style.color = 'var(--red)');
      deleteElement.addEventListener('mouseleave', () => deleteElement.style.color = 'var(--text-muted)');
      
      projectMeta.appendChild(timeElement);
      projectMeta.appendChild(deleteElement);
      projectInfo.appendChild(projectName);
      projectInfo.appendChild(projectMeta);
      projectCard.appendChild(previewElement);
      projectCard.appendChild(projectInfo);
      
      projectCard.onclick = async (event) => {
        const deleteButton = event.target.closest('.pc-delete');
        if (deleteButton) {
          event.stopPropagation();
          await this.deleteProject(project.id);
          return;
        }
        await this.loadProject(project.id);
      };
      
      projectGrid.appendChild(projectCard);
    });
  }
};

export default ProjectManager;
export { ProjectManager };