import { VERSION, BUILD_DATE, BUILD_NUMBER } from '../version';

export class VersionDisplay {
  private element: HTMLElement;
  
  constructor() {
    this.element = document.createElement('div');
    this.element.className = 'tla-version';
    this.element.style.cssText = `
      position: fixed;
      bottom: 5px;
      right: 5px;
      font-size: 10px;
      opacity: 0.5;
      z-index: 10000;
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 2px 5px;
      border-radius: 3px;
      cursor: pointer;
    `;
  }
  
  render() {
    this.element.innerHTML = `TLA v${VERSION}`;
    this.element.title = `Version: ${VERSION}\nBuild: ${BUILD_NUMBER}\nDate: ${BUILD_DATE}`;
    
    // Click to copy version info
    this.element.onclick = () => {
      const info = `TravianAssistant v${VERSION} (Build ${BUILD_NUMBER})`;
      navigator.clipboard.writeText(info);
      this.element.textContent = 'Copied!';
      setTimeout(() => {
        this.element.innerHTML = `TLA v${VERSION}`;
      }, 1000);
    };
    
    return this.element;
  }
  
  attach() {
    document.body.appendChild(this.render());
  }
  
  static init() {
    // Auto-attach on DOM ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      new VersionDisplay().attach();
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        new VersionDisplay().attach();
      });
    }
  }
}