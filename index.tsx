/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { state, initState, registerRenderCallback } from './state.js';
import { DailyLogView, AddEntryView, StatisticsView } from './views.js';
import { Header, Navigation } from './components.js';

let deferredInstallPrompt: any = null;

// --- MAIN RENDER FUNCTION ---
function render() {
  const root = document.getElementById('root');
  if (!root) return;
  root.innerHTML = '';

  const mainContainer = document.createElement('div');
  mainContainer.className = 'flex flex-col h-full';

  mainContainer.appendChild(Header({
      isInstallable: !!deferredInstallPrompt,
      onInstallClick: handleInstallClick
  }));

  const content = document.createElement('main');
  content.className = 'flex-grow overflow-y-auto custom-scrollbar';

  let viewContent;
  switch (state.currentView) {
    case 'add':
      viewContent = AddEntryView();
      break;
    case 'stats':
      viewContent = StatisticsView();
      break;
    case 'log':
    default:
      viewContent = DailyLogView();
      break;
  }
  content.appendChild(viewContent);
  mainContainer.appendChild(content);
  mainContainer.appendChild(Navigation());

  root.appendChild(mainContainer);
}

function handleInstallClick() {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }
        deferredInstallPrompt = null;
        render(); // Re-render to hide the button
    });
}

// --- INITIALIZATION ---
function initializeApp() {
    registerRenderCallback(render);
    initState();
    render();

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredInstallPrompt = e;
        render(); // Show the button
    });
    
    window.addEventListener('appinstalled', () => {
        deferredInstallPrompt = null;
        render(); // Hide the button
        console.log('INSTALL: Success');
    });
}

initializeApp();