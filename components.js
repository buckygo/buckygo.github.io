/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { state, setState } from './state.js';

export function Header({ isInstallable, onInstallClick, onSettingsClick }) {
  const titles = {
    log: '每日日誌',
    add: '新增記錄',
    stats: '統計分析',
  };
  const header = document.createElement('header');
  header.className = 'bg-white/70 backdrop-blur-xl sticky top-0 z-10 flex-shrink-0 border-b border-gray-200/60';
  
  const container = document.createElement('div');
  // Use relative positioning to place the button without affecting the title's centering
  container.className = 'relative p-3 flex items-center justify-center'; 
  
  const title = document.createElement('h1');
  title.className = 'text-xl font-bold text-gray-900 text-center';
  title.textContent = titles[state.currentView];
  container.appendChild(title);

  const rightButtonsContainer = document.createElement('div');
  rightButtonsContainer.className = 'absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1';

  if (isInstallable) {
    const installButton = document.createElement('button');
    installButton.className = 'p-1.5 rounded-full text-blue-600 hover:bg-blue-100 transition-colors duration-200';
    installButton.setAttribute('aria-label', '安裝應用程式');
    installButton.title = '安裝應用程式';
    installButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>`;
    installButton.onclick = onInstallClick;
    rightButtonsContainer.appendChild(installButton);
  }

  const settingsButton = document.createElement('button');
  settingsButton.className = 'p-1.5 rounded-full text-gray-600 hover:bg-gray-200 transition-colors duration-200';
  settingsButton.setAttribute('aria-label', '基本資料設定');
  settingsButton.title = '基本資料設定';
  settingsButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.438.995s.145.755.438.995l1.003.827c.487.402.668 1.07.26 1.431l-1.296 2.247a1.125 1.125 0 0 1-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.075.124a6.57 6.57 0 0 1-.22.127c-.332.183-.582.495-.645.87l-.213 1.281c-.09.543-.56.94-1.11.94h-2.593c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a6.52 6.52 0 0 1-.22-.127c-.324-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 0 1-1.37-.49l-1.296-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.437-.995s-.145-.755-.437-.995l-1.004-.827a1.125 1.125 0 0 1-.26-1.431l1.296-2.247a1.125 1.125 0 0 1 1.37-.49l1.217.456c.355.133.75.072 1.075-.124.073-.044.146-.087.22-.127.332-.183.582-.495.645-.87l.213-1.281Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>`;
  settingsButton.onclick = onSettingsClick;
  rightButtonsContainer.appendChild(settingsButton);

  container.appendChild(rightButtonsContainer);

  header.appendChild(container);
  return header;
}


export function Navigation() {
  const nav = document.createElement('nav');
  nav.className = 'bg-white/70 backdrop-blur-xl sticky bottom-0 z-10 flex-shrink-0 border-t border-gray-200/60';
  
  const createNavButton = (view, label, icon) => {
    const isActive = state.currentView === view;
    const button = document.createElement('button');
    button.dataset.view = view;
    button.className = `nav-button flex-1 flex flex-col items-center py-1.5 transition-colors duration-200 ${isActive ? 'text-blue-500' : 'text-gray-500'}`;
    button.innerHTML = `
      ${icon}
      <span class="text-xs tracking-tight">${label}</span>
    `;
    return button;
  };
  
  const navContainer = document.createElement('div');
  navContainer.className = 'flex justify-around items-center';

  const logIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 mb-0.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>`;
  const addIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-8 h-8"><path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm.5 6.75a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25v2.25a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V9Z" clip-rule="evenodd" /></svg>`;
  const statsIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 mb-0.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>`;

  navContainer.appendChild(createNavButton('log', '日誌', logIcon));
  navContainer.appendChild(createNavButton('add', '新增', addIcon));
  navContainer.appendChild(createNavButton('stats', '統計', statsIcon));
  
  nav.appendChild(navContainer);

  nav.querySelectorAll('.nav-button').forEach(button => {
    button.addEventListener('click', () => {
      const view = button.getAttribute('data-view');
      if (view) {
        setState({ currentView: view });
      }
    });
  });

  return nav;
}