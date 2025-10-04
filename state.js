/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// --- CONFIGURATION ---
export const CATEGORY_CONFIG = {
  '飲食': { icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 15.75a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15.75V11.25a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 11.25v4.5Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 9V5.25M9 9V5.25M15 9V5.25M8.25 9h7.5" /></svg>`, color: 'border-green-500', lightColor: 'bg-green-50', hexColor: '#34C759' },
  '用藥': { icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9.75 14.25 12m0 0 2.25 2.25M14.25 12l2.25-2.25M14.25 12 12 14.25m-2.58 4.92-2.25-2.25m0 0a3.375 3.375 0 0 1-4.773-4.773 3.375 3.375 0 0 1 4.774 4.774ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>`, color: 'border-red-500', lightColor: 'bg-red-50', hexColor: '#FF3B30' },
  '行為': { icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a7.5 7.5 0 0 1 15 0" /></svg>`, color: 'border-blue-500', lightColor: 'bg-blue-50', hexColor: '#007AFF' },
  '事件': { icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0h18" /></svg>`, color: 'border-yellow-500', lightColor: 'bg-yellow-50', hexColor: '#FF9500' },
  '情緒': { icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.828 14.828a4.06 4.06 0 0 1-5.656 0M9 10.5h.008v.008H9v-.008Zm6 0h.008v.008H15v-.008Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>`, color: 'border-purple-500', lightColor: 'bg-purple-50', hexColor: '#AF52DE' },
};

export const SUBCATEGORIES = {
    '飲食': [
        { name: '主食', items: ['白飯', '麵條', '麵包', '燕麥', '地瓜'] },
        { name: '蔬菜', items: ['菠菜', '高麗菜', '青江菜', '花椰菜', '胡蘿蔔', '蔥', '薑'] },
        { name: '肉類', items: ['雞肉', '豬肉', '牛肉', '魚肉', '羊肉', '蝦', '蟹'] },
        { name: '水果', items: ['蘋果', '香蕉', '橘子', '芭樂', '西瓜'] },
    ],
    '用藥': [
        { name: '補劑', items: [] },
        { name: '常規藥物', items: ['利妥能', '安立復'] },
        { name: '臨時藥物', items: ['止痛藥', '過敏藥', '鎮定劑'] },
    ],
    '事件': [
        { name: '日常活動', items: ['上學', '放學', '做功課', '看電視', '戶外活動'] },
        { name: '特殊場合', items: ['看醫生', '家庭聚餐', '生日派對', '考試'] },
    ],
    '行為': [
        { name: '動作抽動', items: ['眨眼', '聳肩', '甩頭', '噘嘴', '肚子用力'] },
        { name: '聲音抽動', items: ['清喉嚨', '咳嗽', '吸鼻子', '尖叫', '發出ㄍㄧㄍㄧ聲'] },
        { name: '複雜抽動', items: ['模仿他人', '重複字句', '觸摸東西', '猥褻手勢'] },
    ],
    '情緒': [
        { name: '今日心情', items: ['開心 😊', '平靜 🙂', '難過 😢', '生氣 😠', '焦慮 😟', '疲倦 😴'] },
    ],
};

export const EMOTION_COLOR_CONFIG = {
  '開心 😊': '#FBBF24', // amber-400
  '平靜 🙂': '#2DD4BF', // teal-400
  '難過 😢': '#60A5FA', // blue-400
  '生氣 😠': '#F87171', // red-400
  '焦慮 😟': '#A78BFA', // violet-400
  '疲倦 😴': '#94A3B8', // slate-400
};
const DEFAULT_EMOTION_COLOR = '#BDBDBD'; // gray-400

export function getEmotionColor(emotion) {
  const coreEmotion = emotion.trim().split(' ')[0];
  const foundKey = Object.keys(EMOTION_COLOR_CONFIG).find(key => key.startsWith(coreEmotion));
  return foundKey ? EMOTION_COLOR_CONFIG[foundKey] : DEFAULT_EMOTION_COLOR;
}

// --- STATE MANAGEMENT ---
export let state = {
  entries: [],
  currentView: 'log',
  dailyInfo: {},
};

export let customItems = {
    '飲食': [], '用藥': [], '行為': [], '事件': [], '情緒': []
};

let renderCallback = () => {};

export function registerRenderCallback(callback) {
    renderCallback = callback;
}

export function setState(newState) {
  Object.assign(state, newState);
  renderCallback();
}

function saveEntries() {
  localStorage.setItem('tic-tracker-entries', JSON.stringify(state.entries));
}

function loadEntries() {
  const saved = localStorage.getItem('tic-tracker-entries');
  if (saved) {
    const entries = JSON.parse(saved);
    entries.sort((a, b) => b.timestamp - a.timestamp);
    state.entries = entries;
  }
}

export function saveCustomItems() {
    localStorage.setItem('tic-tracker-custom-items', JSON.stringify(customItems));
}

function loadCustomItems() {
    const saved = localStorage.getItem('tic-tracker-custom-items');
    if (saved) {
        const parsed = JSON.parse(saved);
        Object.keys(SUBCATEGORIES).forEach(cat => {
            const category = cat;
            if (parsed[category]) {
                customItems[category] = parsed[category];
            }
        });
    }
}

function saveDailyInfo() {
    localStorage.setItem('tic-tracker-daily-info', JSON.stringify(state.dailyInfo));
}

function loadDailyInfo() {
  const saved = localStorage.getItem('tic-tracker-daily-info');
  if (saved) {
    state.dailyInfo = JSON.parse(saved);
  }
}

export function setDailyInfo(date, info) {
    const newDailyInfo = { ...state.dailyInfo, [date]: info };
    setState({ dailyInfo: newDailyInfo });
    saveDailyInfo();
}

export function addEntry(category, content, timestamp) {
  if (!content.trim()) return;
  const newEntry = {
    id: `${timestamp}-${Math.random()}`,
    timestamp,
    category,
    content: content.trim(),
  };
  const updatedEntries = [newEntry, ...state.entries];
  updatedEntries.sort((a, b) => b.timestamp - a.timestamp);
  setState({ entries: updatedEntries, currentView: 'log' });
  saveEntries();
}

export function updateEntry(id, updates) {
  const updatedEntries = state.entries.map(entry => {
    if (entry.id === id) {
      return { ...entry, ...updates };
    }
    return entry;
  });
  updatedEntries.sort((a, b) => b.timestamp - a.timestamp);
  setState({ entries: updatedEntries });
  saveEntries();
}

export function deleteEntry(id) {
  const updatedEntries = state.entries.filter(entry => entry.id !== id);
  setState({ entries: updatedEntries });
  saveEntries();
}

export function initState() {
    loadEntries();
    loadCustomItems();
    loadDailyInfo();
}