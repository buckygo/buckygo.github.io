/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// --- CONFIGURATION ---
export const CATEGORY_CONFIG = {
  '飲食': { icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 15.75a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15.75V11.25a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 11.25v4.5Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 9V5.25M9 9V5.25M15 9V5.25M8.25 9h7.5" /></svg>`, color: 'border-cyan-500', lightColor: 'bg-cyan-50', hexColor: '#06b6d4' },
  '健康': { icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>`, color: 'border-cyan-500', lightColor: 'bg-cyan-50', hexColor: '#06b6d4' },
  '用藥': { icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9.75 14.25 12m0 0 2.25 2.25M14.25 12l2.25-2.25M14.25 12 12 14.25m-2.58 4.92-2.25-2.25m0 0a3.375 3.375 0 0 1-4.773-4.773 3.375 3.375 0 0 1 4.774 4.774ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>`, color: 'border-red-500', lightColor: 'bg-red-50', hexColor: '#FF3B30' },
  '行為': { icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a7.5 7.5 0 0 1 15 0" /></svg>`, color: 'border-blue-500', lightColor: 'bg-blue-50', hexColor: '#007AFF' },
  '事件': { icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0h18" /></svg>`, color: 'border-yellow-500', lightColor: 'bg-yellow-50', hexColor: '#FF9500' },
  '情緒': { icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.828 14.828a4.06 4.06 0 0 1-5.656 0M9 10.5h.008v.008H9v-.008Zm6 0h.008v.008H15v-.008Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>`, color: 'border-purple-500', lightColor: 'bg-purple-50', hexColor: '#AF52DE' },
};

export const SUBCATEGORIES = {
    '飲食': [
        { name: '主食', items: ['白飯', '麵條', '麵包', '燕麥', '地瓜', '水餃'] },
        { name: '蔬菜', items: ['菠菜', '高麗菜', '青江菜', '花椰菜', '胡蘿蔔', '番茄'] },
        { name: '肉類/蛋白質', items: ['雞肉', '豬肉', '牛肉', '魚肉', '蛋', '豆製品'] },
        { name: '水果', items: ['蘋果', '香蕉', '橘子', '芭樂', '西瓜', '葡萄'] },
        { name: '飲品', items: ['牛奶', '豆漿', '含糖飲料', '咖啡因飲品', '果汁'] },
        { name: '零食/加工品', items: ['餅乾', '糖果', '巧克力', '炸物', '冰淇淋'] },
        { name: '常見過敏原', items: [] },
    ],
    '健康': [
        { name: '睡眠', items: [] },
        { name: '螢幕時間', items: [] },
        { name: '運動', items: ['跑步', '游泳', '騎自行車', '散步', '打球'] },
        { name: '身體狀況', items: ['精神好', '疲倦', '頭痛', '肚子痛', '便秘', '過敏', '感冒', '發燒'] },
    ],
    '用藥': [
        { name: '常規藥物', items: ['利妥能', '安立復'] },
        { name: '保健補劑', items: ['綜合維他命', '維他命B群', '魚油', '鎂'] },
        { name: '臨時藥物', items: ['止痛藥', '過敏藥', '鎮定劑'] },
    ],
    '事件': [
        { name: '學校/學習', items: ['上學', '放學', '寫功課', '考試', '被稱讚', '被責備'] },
        { name: '家庭/日常', items: ['看電視', '玩電玩', '戶外活動', '親子互動', '手足衝突'] },
        { name: '特殊場合', items: ['看醫生', '家庭聚餐', '生日派對', '親友來訪', '長途旅行'] },
        { name: '環境', items: ['天氣變化', '吵雜環境', '人多擁擠'] },
    ],
    '行為': [
        { name: '動作抽動', items: ['眨眼', '聳肩', '甩頭', '噘嘴', '做鬼臉', '肚子用力'] },
        { name: '聲音抽動', items: ['清喉嚨', '咳嗽', '吸鼻子', '尖叫', '嗯嗯聲', '學動物叫'] },
        { name: '複雜抽動', items: ['模仿他人', '重複字句', '觸摸東西', '寫字重描'] },
    ],
    '情緒': [
        { name: '今日心情', items: ['開心 😊', '平靜 🙂', '難過 😢', '生氣 😠', '焦慮 😟', '興奮/亢奮 😄', '疲倦 😴', '無聊 😑'] },
    ],
};

export const EMOTION_COLOR_CONFIG = {
  '開心 😊': '#FBBF24', // amber-400
  '平靜 🙂': '#2DD4BF', // teal-400
  '難過 😢': '#60A5FA', // blue-400
  '生氣 😠': '#F87171', // red-400
  '焦慮 😟': '#A78BFA', // violet-400
  '興奮/亢奮 😄': '#F97316', // orange-400
  '疲倦 😴': '#94A3B8', // slate-400
  '無聊 😑': '#64748B', // slate-500
};
const DEFAULT_EMOTION_COLOR = '#BDBDBD'; // gray-400

export function getEmotionColor(emotion) {
  const coreEmotion = emotion.trim().split(' ')[0];
  const foundKey = Object.keys(EMOTION_COLOR_CONFIG).find(key => key.startsWith(coreEmotion));
  return foundKey ? EMOTION_COLOR_CONFIG[foundKey] : DEFAULT_EMOTION_COLOR;
}

export function getBMICategory(bmi) {
    if (bmi < 18.5) return { category: '體重過輕', color: '#3B82F6' }; // blue-500
    if (bmi >= 18.5 && bmi < 24) return { category: '正常範圍', color: '#22C55E' }; // green-500
    if (bmi >= 24 && bmi < 27) return { category: '體重過重', color: '#F97316' }; // orange-500
    if (bmi >= 27) return { category: '肥胖', color: '#EF4444' }; // red-500
    return { category: '無法計算', color: '#6B7280' }; // gray-500
}


// --- STATE MANAGEMENT ---
export let state = {
  entries: [],
  currentView: 'log',
  currentStatsView: 'charts',
  dailyInfo: {},
  basicInfo: {},
  basicInfoHistory: [],
};

export let customItems = {
    '飲食': [], '健康': [], '用藥': [], '行為': [], '事件': [], '情緒': []
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

function saveBasicInfo() {
  localStorage.setItem('tic-tracker-basic-info', JSON.stringify(state.basicInfo));
}

function loadBasicInfo() {
  const saved = localStorage.getItem('tic-tracker-basic-info');
  if (saved) {
    state.basicInfo = JSON.parse(saved);
  }
}

function saveBasicInfoHistory() {
  localStorage.setItem('tic-tracker-basic-info-history', JSON.stringify(state.basicInfoHistory));
}

function loadBasicInfoHistory() {
  const saved = localStorage.getItem('tic-tracker-basic-info-history');
  if (saved) {
    const history = JSON.parse(saved);
    history.sort((a, b) => a.timestamp - b.timestamp);
    state.basicInfoHistory = history;
  }
}

export function updateBasicInfo(info, isAdding = false) {
    const newBasicInfo = isAdding ? info : { ...state.basicInfo, ...info };

    const lastHistoryEntry = state.basicInfoHistory.length > 0 ? state.basicInfoHistory[state.basicInfoHistory.length - 1] : null;
    const hasChanged = !lastHistoryEntry || 
                        lastHistoryEntry.height !== newBasicInfo.height ||
                        lastHistoryEntry.weight !== newBasicInfo.weight ||
                        lastHistoryEntry.age !== newBasicInfo.age;
    
    // Always update current basic info
    setState({ basicInfo: newBasicInfo });
    saveBasicInfo();

    // Add to history if it's a new entry, or if there's a change, and data is present
    if ((isAdding || hasChanged) && (newBasicInfo.height != null || newBasicInfo.weight != null || newBasicInfo.age != null)) {
        const newHistoryEntry = {
            timestamp: Date.now(),
            age: newBasicInfo.age,
            height: newBasicInfo.height,
            weight: newBasicInfo.weight,
        };
        const updatedHistory = [...state.basicInfoHistory, newHistoryEntry];
        updatedHistory.sort((a, b) => a.timestamp - b.timestamp);
        setState({ basicInfoHistory: updatedHistory });
        saveBasicInfoHistory();
    }
}

export function updateBasicInfoHistoryEntry(timestamp, updates) {
    const updatedHistory = state.basicInfoHistory.map(entry => {
        if (entry.timestamp === timestamp) {
            return { ...entry, ...updates };
        }
        return entry;
    });

    updatedHistory.sort((a, b) => a.timestamp - b.timestamp);
    
    const latestInfo = updatedHistory.length > 0 ? updatedHistory[updatedHistory.length - 1] : {};
    
    setState({ 
        basicInfoHistory: updatedHistory,
        basicInfo: {
            age: latestInfo.age,
            height: latestInfo.height,
            weight: latestInfo.weight,
        }
    });
    saveBasicInfoHistory();
    saveBasicInfo();
}

export function deleteBasicInfoHistoryEntry(timestamp) {
    const updatedHistory = state.basicInfoHistory.filter(entry => entry.timestamp !== timestamp);
    
    const latestInfo = updatedHistory.length > 0 ? updatedHistory[updatedHistory.length - 1] : {};

    setState({ 
        basicInfoHistory: updatedHistory,
        basicInfo: {
            age: latestInfo.age,
            height: latestInfo.height,
            weight: latestInfo.weight,
        }
    });
    saveBasicInfoHistory();
    saveBasicInfo();
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
    loadBasicInfo();
    loadBasicInfoHistory();
}