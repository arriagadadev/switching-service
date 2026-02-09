export type ToastType = 'success' | 'error' | 'info';

let container: HTMLDivElement | null = null;

function ensureContainer() {
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed; top: 16px; right: 16px; z-index: 9999;
      display: flex; flex-direction: column; gap: 8px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }
  return container;
}

function showToast(message: string, type: ToastType = 'info') {
  const elem = document.createElement('div');
  const colors = { success: '#4caf50', error: '#f44336', info: '#2196f3' };
  elem.style.cssText = `
    padding: 12px 20px; border-radius: 8px; color: white;
    background: ${colors[type]}; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: slideIn 0.3s ease;
    pointer-events: auto;
  `;
  elem.textContent = message;
  ensureContainer().appendChild(elem);
  setTimeout(() => {
    elem.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => elem.remove(), 300);
  }, 3000);
}

export function useToast() {
  return {
    success: (msg: string) => showToast(msg, 'success'),
    error: (msg: string) => showToast(msg, 'error'),
    info: (msg: string) => showToast(msg, 'info'),
  };
}

// Add keyframes
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);
