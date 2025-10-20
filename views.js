
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI } from "@google/genai";
import { 
    state, 
    customItems, 
    addEntry, 
    deleteEntry, 
    updateEntry,
    saveCustomItems,
    setDailyInfo,
    updateBasicInfo,
    setState,
    CATEGORY_CONFIG,
    SUBCATEGORIES,
    getBMICategory,
    updateBasicInfoHistoryEntry,
    deleteBasicInfoHistoryEntry,
} from './state.js';
import { renderStackedBarChart, renderBarChart, renderPieChart, renderComboChart, renderGrowthChart } from './charts.js';

// --- GEMINI AI ANALYSIS ---
const API_KEY = globalThis.process?.env?.API_KEY;
let ai = null;
if (API_KEY) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
    console.error("Gemini API Key is not configured.");
}

async function analyzeLogsWithGemini(entries, period, category) {
    if (!ai) {
        throw new Error('AI 服務未配置，請確認 API Key。');
    }

    const formattedEntries = entries.map(e => ({
        timestamp: new Date(e.timestamp).toISOString().substring(0, 16).replace('T', ' '),
        category: e.category,
        content: e.content
    }));

    const prompt = `您是一位專業的抽動症日誌分析AI助理。您的目標是根據家長記錄的日常日誌，幫助他們識別潛在的模式和觸發因素。請以支持、清晰且非醫療建議的語氣提供見解。請務必使用繁體中文輸出。您的分析應簡潔易懂。

這是我孩子在過去 ${period} 天的日誌資料。'行為' 類別記錄了與抽動相關的行為。

日誌資料 (JSON):
${JSON.stringify(formattedEntries)}

請根據以上資料，提供一份簡要分析，並側重於使用者當前選擇的「${category}」類別。
1.  **趨勢總結：** 簡要總結「${category}」類別中條目的頻率和類型。
2.  **潛在關聯：** 識別「${category}」類別的條目與抽動行為（'行為'類別）之間是否存在任何潛在的關聯性。例如，某些食物、事件或情緒是否似乎與抽動增加同時發生？
3.  **觀察建議：** 根據分析，提出家長可以多加注意觀察的具體事項。請將這些建議作為觀察建議，而非醫療建議。

請清晰地格式化您的回覆，使用 markdown 語法 (例如用 **粗體** 強調關鍵字)。`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error('Error analyzing logs with Gemini:', error);
        throw new Error('AI 分析時發生錯誤，請稍後再試。');
    }
}


function getWeatherDisplayInfo(code) {
    if (code === 0) return { icon: '☀️', description: '晴天' };
    if (code === 1) return { icon: '🌤️', description: '大致晴朗' };
    if (code === 2) return { icon: '⛅️', description: '多雲' };
    if (code === 3) return { icon: '☁️', description: '陰天' };
    if ([45, 48].includes(code)) return { icon: '🌫️', description: '有霧' };
    if ([51, 53, 55, 56, 57].includes(code)) return { icon: '💧', description: '毛毛雨' };
    if ([61, 63, 65, 66, 67].includes(code)) return { icon: '🌧️', description: '下雨' };
    if ([71, 73, 75, 77].includes(code)) return { icon: '❄️', description: '下雪' };
    if ([80, 81, 82].includes(code)) return { icon: '🌦️', description: '陣雨' };
    if ([85, 86].includes(code)) return { icon: '🌨️', description: '陣雪' };
    if ([95, 96, 99].includes(code)) return { icon: '⛈️', description: '雷雨' };
    return { icon: '🌡️', description: '未知' };
}

function createSleepInputUI(bedtime = '22:00', waketime = '07:00') {
    const sleepContainer = document.createElement('div');
    sleepContainer.className = 'space-y-4 pt-2';
    sleepContainer.innerHTML = `
        <div>
            <label for="bedtime" class="block text-sm font-medium text-gray-700">就寢時間</label>
            <input type="time" id="bedtime" value="${bedtime}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-lg p-2">
        </div>
        <div>
            <label for="waketime" class="block text-sm font-medium text-gray-700">起床時間</label>
            <input type="time" id="waketime" value="${waketime}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-lg p-2">
        </div>
    `;
    return sleepContainer;
}

export function showBasicInfoModal({ isAdding = false } = {}) {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4 animate-fade-in-fast';

    const panel = document.createElement('div');
    panel.className = 'bg-white rounded-xl shadow-xl w-full max-w-sm animate-slide-up flex flex-col';

    const header = document.createElement('div');
    header.className = 'p-4 border-b flex items-center justify-between';
    header.innerHTML = `<h3 class="font-semibold text-center text-lg text-gray-800">${isAdding ? '新增基本資料' : '編輯基本資料'}</h3>`;
    const closeButton = document.createElement('button');
    closeButton.className = 'p-1 text-gray-500 hover:text-gray-800 rounded-full';
    closeButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>`;
    closeButton.onclick = () => overlay.remove();
    header.appendChild(closeButton);

    const body = document.createElement('div');
    body.className = 'p-4 space-y-4';
    const info = isAdding ? {} : state.basicInfo;
    
    body.innerHTML = `
        <div>
            <label for="basic-age" class="block text-sm font-medium text-gray-700">年齡</label>
            <div class="mt-1 relative rounded-md shadow-sm">
                <input type="number" step="1" min="0" id="basic-age" value="${info.age ?? ''}" class="block w-full rounded-md border-gray-300 pl-3 pr-12 focus:border-indigo-500 focus:ring-indigo-500 text-lg p-2" placeholder="請輸入年齡">
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"><span class="text-gray-500">歲</span></div>
            </div>
        </div>
        <div>
            <label for="basic-height" class="block text-sm font-medium text-gray-700">身高</label>
            <div class="mt-1 relative rounded-md shadow-sm">
                <input type="number" step="0.1" min="0" id="basic-height" value="${info.height ?? ''}" class="block w-full rounded-md border-gray-300 pl-3 pr-16 focus:border-indigo-500 focus:ring-indigo-500 text-lg p-2" placeholder="請輸入身高">
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"><span class="text-gray-500">公分</span></div>
            </div>
        </div>
        <div>
            <label for="basic-weight" class="block text-sm font-medium text-gray-700">體重</label>
            <div class="mt-1 relative rounded-md shadow-sm">
                <input type="number" step="0.1" min="0" id="basic-weight" value="${info.weight ?? ''}" class="block w-full rounded-md border-gray-300 pl-3 pr-16 focus:border-indigo-500 focus:ring-indigo-500 text-lg p-2" placeholder="請輸入體重">
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"><span class="text-gray-500">公斤</span></div>
            </div>
        </div>
    `;

    const footer = document.createElement('div');
    footer.className = 'p-3 bg-gray-50 flex justify-end';

    const saveButton = document.createElement('button');
    saveButton.className = 'px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition';
    saveButton.textContent = '儲存';
    saveButton.onclick = () => {
        const ageInput = panel.querySelector('#basic-age');
        const heightInput = panel.querySelector('#basic-height');
        const weightInput = panel.querySelector('#basic-weight');
        
        const getVal = (input) => {
            if (!input || input.value.trim() === '') return undefined;
            const num = parseFloat(input.value);
            return isNaN(num) ? undefined : num;
        };

        const newInfo = {
            age: getVal(ageInput),
            height: getVal(heightInput),
            weight: getVal(weightInput),
        };
        updateBasicInfo(newInfo, isAdding);
        overlay.remove();
    };

    footer.appendChild(saveButton);
    panel.appendChild(header);
    panel.appendChild(body);
    panel.appendChild(footer);
    overlay.onclick = (e) => {
        if (e.target === overlay) overlay.remove();
    };
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
}

export function DailyLogView() {
  const container = document.createElement('div');
  container.className = 'px-4 pb-4';

    const showDeleteConfirmation = (entry) => {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4 animate-fade-in-fast';

        const panel = document.createElement('div');
        panel.className = 'bg-white rounded-xl shadow-xl w-full max-w-xs animate-slide-up flex flex-col';

        const header = document.createElement('div');
        header.className = 'p-3 border-b';
        header.innerHTML = `<h3 class="font-semibold text-center text-red-600">確認刪除</h3>`;

        const body = document.createElement('div');
        body.className = 'p-4 text-center';
        
        const safeContent = document.createElement('div');
        safeContent.textContent = entry.content;
        
        body.innerHTML = `您確定要刪除這筆<br>「<strong class="text-gray-800">${entry.category}</strong>」記錄嗎？<br><div class="mt-2 p-2 bg-gray-100 rounded text-sm text-gray-600 max-h-24 overflow-y-auto custom-scrollbar">${safeContent.innerHTML}</div>`;

        const footer = document.createElement('div');
        footer.className = 'p-2 bg-gray-50 grid grid-cols-2 gap-2';

        const cancelButton = document.createElement('button');
        cancelButton.className = 'px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition';
        cancelButton.textContent = '取消';
        cancelButton.onclick = () => overlay.remove();

        const confirmButton = document.createElement('button');
        confirmButton.className = 'px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition';
        confirmButton.textContent = '刪除';
        confirmButton.onclick = () => {
            deleteEntry(entry.id);
            overlay.remove();
        };

        footer.appendChild(cancelButton);
        footer.appendChild(confirmButton);
        panel.appendChild(header);
        panel.appendChild(body);
        panel.appendChild(footer);
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
        };
        overlay.appendChild(panel);
        document.body.appendChild(overlay);
    };

    const showCustomInputModal = (onConfirm, title = '新增自訂項目') => {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70] p-4 animate-fade-in-fast';
        
        const panel = document.createElement('div');
        panel.className = 'bg-white rounded-xl shadow-xl w-full max-w-xs animate-slide-up flex flex-col';

        const header = document.createElement('div');
        header.className = 'p-3 border-b';
        header.innerHTML = `<h3 class="font-semibold text-center text-gray-800">${title}</h3>`;
        
        const body = document.createElement('div');
        body.className = 'p-4';
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
        input.placeholder = '請輸入內容...';
        input.onkeydown = (e) => {
            if (e.key === 'Enter') confirmButton.click();
        };
        body.appendChild(input);

        const footer = document.createElement('div');
        footer.className = 'p-2 bg-gray-50 grid grid-cols-2 gap-2';
        
        const cancelButton = document.createElement('button');
        cancelButton.className = 'px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition';
        cancelButton.textContent = '取消';
        cancelButton.onclick = () => overlay.remove();

        const confirmButton = document.createElement('button');
        confirmButton.className = 'px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition';
        confirmButton.textContent = '確認';
        confirmButton.onclick = () => {
            const value = input.value.trim();
            if (value) {
                onConfirm(value);
            }
            overlay.remove();
        };

        footer.appendChild(cancelButton);
        footer.appendChild(confirmButton);
        panel.appendChild(header);
        panel.appendChild(body);
        panel.appendChild(footer);
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
        };
        overlay.appendChild(panel);
        document.body.appendChild(overlay);
        setTimeout(() => input.focus(), 50);
    };

    const showEditModal = (entry) => {
        const { id, category, timestamp } = entry;
        let initialContent = entry.content;

        const selectedItems = new Set();
        let selectedMealType = null;
        let viewingSubCategoryItems = null;
        let lastAddedItem = null;

        if (category === '飲食') {
            const match = initialContent.match(/^([^:]+):\s*(.*)$/);
            const mealTypes = ['早餐', '中餐', '晚餐', '點心'];
            if (match && mealTypes.includes(match[1])) {
                selectedMealType = match[1];
                initialContent = match[2];
            }
        }
        
        initialContent.split(', ').forEach(item => {
            if (item.trim()) selectedItems.add(item.trim());
        });
        
        const modalOverlay = document.createElement('div');
        const modalPanel = document.createElement('div');
        let selectionPreviewContainer = null;
        const footer = document.createElement('div');
        const confirmButton = document.createElement('button');
        
        const closeModal = () => modalOverlay.remove();
        
        const showDeleteItemConfirmation = (itemName, cat, subCatName) => {
             const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70] p-4 animate-fade-in-fast';

            const panel = document.createElement('div');
            panel.className = 'bg-white rounded-xl shadow-xl w-full max-w-xs animate-slide-up flex flex-col';

            const header = document.createElement('div');
            header.className = 'p-3 border-b';
            header.innerHTML = `<h3 class="font-semibold text-center text-red-600">確認刪除</h3>`;

            const body = document.createElement('div');
            body.className = 'p-4 text-center';
            body.innerHTML = `您確定要刪除「<strong class="text-red-700">${itemName}</strong>」嗎？<br><span class="text-sm text-gray-500">此操作無法復原。</span>`;

            const footer = document.createElement('div');
            footer.className = 'p-2 bg-gray-50 grid grid-cols-2 gap-2';

            const cancelButton = document.createElement('button');
            cancelButton.className = 'px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition';
            cancelButton.textContent = '取消';
            cancelButton.onclick = () => overlay.remove();

            const confirmButton = document.createElement('button');
            confirmButton.className = 'px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition';
            confirmButton.textContent = '刪除';
            confirmButton.onclick = () => {
                if (customItems[cat]) {
                    const targetSubCat = customItems[cat].find(sc => sc.name === subCatName);
                    if (targetSubCat) {
                        targetSubCat.items = targetSubCat.items.filter(i => i !== itemName);
                        saveCustomItems();
                    }
                }
                
                if (selectedItems.has(itemName)) {
                    selectedItems.delete(itemName);
                }

                overlay.remove();
                renderModalContent();
            };

            footer.appendChild(cancelButton);
            footer.appendChild(confirmButton);
            panel.appendChild(header);
            panel.appendChild(body);
            panel.appendChild(footer);
            overlay.onclick = (e) => {
                if (e.target === overlay) overlay.remove();
            };
            overlay.appendChild(panel);
            document.body.appendChild(overlay);
        };

        const showDeleteSubCategoryConfirmation = (subCatName, cat) => {
            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70] p-4 animate-fade-in-fast';

            const panel = document.createElement('div');
            panel.className = 'bg-white rounded-xl shadow-xl w-full max-w-xs animate-slide-up flex flex-col';

            const header = document.createElement('div');
            header.className = 'p-3 border-b';
            header.innerHTML = `<h3 class="font-semibold text-center text-red-600">確認刪除子分類</h3>`;

            const body = document.createElement('div');
            body.className = 'p-4 text-center';
            body.innerHTML = `您確定要刪除「<strong class="text-red-700">${subCatName}</strong>」子分類嗎？<br><span class="text-sm text-gray-500">所有在此分類下的自訂項目也將被刪除。</span>`;

            const footer = document.createElement('div');
            footer.className = 'p-2 bg-gray-50 grid grid-cols-2 gap-2';

            const cancelButton = document.createElement('button');
            cancelButton.className = 'px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition';
            cancelButton.textContent = '取消';
            cancelButton.onclick = () => overlay.remove();

            const confirmButton = document.createElement('button');
            confirmButton.className = 'px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition';
            confirmButton.textContent = '刪除';
            confirmButton.onclick = () => {
                if (customItems[cat]) {
                    customItems[cat] = customItems[cat].filter(sc => sc.name !== subCatName);
                    saveCustomItems();
                }
                overlay.remove();
                renderModalContent();
            };

            footer.appendChild(cancelButton);
            footer.appendChild(confirmButton);
            panel.appendChild(header);
            panel.appendChild(body);
            panel.appendChild(footer);
            overlay.onclick = (e) => {
                if (e.target === overlay) overlay.remove();
            };
            overlay.appendChild(panel);
            document.body.appendChild(overlay);
        };

        const showEditSubCategoryModal = (oldSubCatName, category) => {
            const onConfirm = (newSubCatName) => {
                if (!customItems[category]) return;
                const targetSubCat = customItems[category].find(sc => sc.name === oldSubCatName);
                if (targetSubCat) {
                    targetSubCat.name = newSubCatName;
                    saveCustomItems();
                    if (viewingSubCategoryItems === oldSubCatName) {
                        viewingSubCategoryItems = newSubCatName;
                    }
                    renderModalContent();
                }
            };
            
            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[90] p-4 animate-fade-in-fast';
            
            const panel = document.createElement('div');
            panel.className = 'bg-white rounded-xl shadow-xl w-full max-w-xs animate-slide-up flex flex-col';
        
            const header = document.createElement('div');
            header.className = 'p-3 border-b';
            header.innerHTML = `<h3 class="font-semibold text-center text-gray-800">修改子分類名稱</h3>`;
            
            const body = document.createElement('div');
            body.className = 'p-4';
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
            input.value = oldSubCatName;
            input.onkeydown = (e) => { if (e.key === 'Enter') confirmButton.click(); };
            body.appendChild(input);
        
            const footer = document.createElement('div');
            footer.className = 'p-2 bg-gray-50 grid grid-cols-2 gap-2';
            
            const cancelButton = document.createElement('button');
            cancelButton.className = 'px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition';
            cancelButton.textContent = '取消';
            cancelButton.onclick = () => overlay.remove();
        
            const confirmButton = document.createElement('button');
            confirmButton.className = 'px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition';
            confirmButton.textContent = '儲存';
            confirmButton.onclick = () => {
                const value = input.value.trim();
                if (value && value !== oldSubCatName) {
                    const isDuplicate = (SUBCATEGORIES[category]?.some(sc => sc.name === value)) ||
                                        (customItems[category]?.some(sc => sc.name === value));
                     if (!isDuplicate) {
                         onConfirm(value);
                     }
                }
                overlay.remove();
            };
        
            footer.appendChild(cancelButton);
            footer.appendChild(confirmButton);
            panel.appendChild(header);
            panel.appendChild(body);
            panel.appendChild(footer);
            overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
            overlay.appendChild(panel);
            document.body.appendChild(overlay);
            setTimeout(() => { input.focus(); input.select(); }, 50);
        };

        const showSubCategoryActionMenu = (subCatName, category) => {
            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 bg-black bg-opacity-40 z-[80] animate-fade-in-fast';
        
            const panel = document.createElement('div');
            panel.className = 'fixed bottom-0 left-0 right-0 p-2 bg-transparent rounded-t-2xl animate-slide-up max-w-md mx-auto';
            
            const actionsGroup = document.createElement('div');
            actionsGroup.className = 'bg-white/80 backdrop-blur-xl rounded-xl overflow-hidden';
        
            const editButton = document.createElement('button');
            editButton.className = 'w-full p-3 text-center text-blue-500 font-semibold text-lg hover:bg-gray-100 transition';
            editButton.textContent = '修改名稱';
            editButton.onclick = () => {
                overlay.remove();
                showEditSubCategoryModal(subCatName, category);
            };
        
            const deleteButton = document.createElement('button');
            deleteButton.className = 'w-full p-3 text-center text-red-500 font-semibold text-lg hover:bg-gray-100 transition';
            deleteButton.textContent = '刪除分類';
            deleteButton.onclick = () => {
                overlay.remove();
                showDeleteSubCategoryConfirmation(subCatName, category);
            };
            
            const separator = document.createElement('div');
            separator.className = 'h-px bg-gray-300/60';
        
            actionsGroup.appendChild(editButton);
            actionsGroup.appendChild(separator);
            actionsGroup.appendChild(deleteButton);
        
            const cancelButton = document.createElement('button');
            cancelButton.className = 'w-full p-3 mt-2 text-center text-blue-500 font-bold text-lg bg-white/80 backdrop-blur-xl rounded-xl hover:bg-gray-100 transition';
            cancelButton.textContent = '取消';
            cancelButton.onclick = () => overlay.remove();
        
            panel.appendChild(actionsGroup);
            panel.appendChild(cancelButton);
            overlay.appendChild(panel);
            overlay.onclick = (e) => {
                if (e.target === overlay) overlay.remove();
            };
            document.body.appendChild(overlay);
        };
        
        const showEditCustomItemModal = (oldItemName, category, subCatName) => {
            const onConfirm = (newItemName) => {
                if (!customItems[category]) return;
                const targetSubCat = customItems[category].find(sc => sc.name === subCatName);
                if (targetSubCat) {
                    const itemIndex = targetSubCat.items.indexOf(oldItemName);
                    if (itemIndex > -1) {
                        targetSubCat.items[itemIndex] = newItemName;
                        if (selectedItems.has(oldItemName)) {
                            selectedItems.delete(oldItemName);
                            selectedItems.add(newItemName);
                        }
                        saveCustomItems();
                        renderModalContent();
                    }
                }
            };
            
            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[90] p-4 animate-fade-in-fast';
            
            const panel = document.createElement('div');
            panel.className = 'bg-white rounded-xl shadow-xl w-full max-w-xs animate-slide-up flex flex-col';
        
            const header = document.createElement('div');
            header.className = 'p-3 border-b';
            header.innerHTML = `<h3 class="font-semibold text-center text-gray-800">修改項目</h3>`;
            
            const body = document.createElement('div');
            body.className = 'p-4';
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
            input.value = oldItemName;
            input.onkeydown = (e) => { if (e.key === 'Enter') confirmButton.click(); };
            body.appendChild(input);
        
            const footer = document.createElement('div');
            footer.className = 'p-2 bg-gray-50 grid grid-cols-2 gap-2';
            
            const cancelButton = document.createElement('button');
            cancelButton.className = 'px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition';
            cancelButton.textContent = '取消';
            cancelButton.onclick = () => overlay.remove();
        
            const confirmButton = document.createElement('button');
            confirmButton.className = 'px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition';
            confirmButton.textContent = '儲存';
            confirmButton.onclick = () => {
                const value = input.value.trim();
                if (value && value !== oldItemName) {
                    let isDuplicate = false;
                    if (customItems[category]) {
                        const targetSubCat = customItems[category].find(sc => sc.name === subCatName);
                        if (targetSubCat && targetSubCat.items.includes(value)) {
                            isDuplicate = true;
                        }
                    }
                     if (!isDuplicate) {
                         onConfirm(value);
                     }
                }
                overlay.remove();
            };
        
            footer.appendChild(cancelButton);
            footer.appendChild(confirmButton);
            panel.appendChild(header);
            panel.appendChild(body);
            panel.appendChild(footer);
            overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
            overlay.appendChild(panel);
            document.body.appendChild(overlay);
            setTimeout(() => { input.focus(); input.select(); }, 50);
        };

        const showCustomItemActionMenu = (itemName, category, subCatName) => {
            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 bg-black bg-opacity-40 z-[80] animate-fade-in-fast';
        
            const panel = document.createElement('div');
            panel.className = 'fixed bottom-0 left-0 right-0 p-2 bg-transparent rounded-t-2xl animate-slide-up max-w-md mx-auto';
            
            const actionsGroup = document.createElement('div');
            actionsGroup.className = 'bg-white/80 backdrop-blur-xl rounded-xl overflow-hidden';
        
            const editButton = document.createElement('button');
            editButton.className = 'w-full p-3 text-center text-blue-500 font-semibold text-lg hover:bg-gray-100 transition';
            editButton.textContent = '修改項目';
            editButton.onclick = () => {
                overlay.remove();
                showEditCustomItemModal(itemName, category, subCatName);
            };
        
            const deleteButton = document.createElement('button');
            deleteButton.className = 'w-full p-3 text-center text-red-500 font-semibold text-lg hover:bg-gray-100 transition';
            deleteButton.textContent = '刪除項目';
            deleteButton.onclick = () => {
                overlay.remove();
                showDeleteItemConfirmation(itemName, category, subCatName);
            };
            
            const separator = document.createElement('div');
            separator.className = 'h-px bg-gray-300/60';
        
            actionsGroup.appendChild(editButton);
            actionsGroup.appendChild(separator);
            actionsGroup.appendChild(deleteButton);
        
            const cancelButton = document.createElement('button');
            cancelButton.className = 'w-full p-3 mt-2 text-center text-blue-500 font-bold text-lg bg-white/80 backdrop-blur-xl rounded-xl hover:bg-gray-100 transition';
            cancelButton.textContent = '取消';
            cancelButton.onclick = () => overlay.remove();
        
            panel.appendChild(actionsGroup);
            panel.appendChild(cancelButton);
            overlay.appendChild(panel);
            overlay.onclick = (e) => {
                if (e.target === overlay) overlay.remove();
            };
            document.body.appendChild(overlay);
        };

        const updateSelectionPreview = () => {
            if (!selectionPreviewContainer) return;
            selectionPreviewContainer.innerHTML = '';
            
            if (category === '健康' && viewingSubCategoryItems === '睡眠') {
                selectionPreviewContainer.className = 'p-3 border-b border-gray-200 bg-white text-center text-gray-500 text-sm';
                selectionPreviewContainer.textContent = '請輸入就寢與起床時間';
                return;
            }

            if (selectedItems.size === 0) {
                selectionPreviewContainer.className = 'p-3 border-b border-gray-200 bg-white text-center text-gray-500 text-sm';
                selectionPreviewContainer.textContent = '尚未選擇任何項目';
                return;
            }
            
            selectionPreviewContainer.className = 'p-3 border-b border-gray-200 bg-white max-h-32 overflow-y-auto custom-scrollbar';
            const title = document.createElement('p');
            title.className = 'text-xs font-semibold text-gray-600 mb-2';
            title.textContent = `已選擇 ${selectedItems.size} 個項目：`;
            selectionPreviewContainer.appendChild(title);

            const itemsList = document.createElement('div');
            itemsList.className = 'flex flex-wrap gap-2';
            
            Array.from(selectedItems).forEach(item => {
                const tag = document.createElement('span');
                tag.className = 'bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full flex items-center';
                
                const textSpan = document.createElement('span');
                textSpan.textContent = item;
                tag.appendChild(textSpan);
                
                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'ml-1.5 -mr-0.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-blue-600 hover:bg-blue-200 hover:text-blue-800 transition-colors';
                removeBtn.setAttribute('aria-label', `移除 ${item}`);
                removeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-3 h-3"><path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" /></svg>`;
                removeBtn.onclick = (e) => {
                    e.stopPropagation();
                    selectedItems.delete(item);
                    renderModalContent();
                };
                tag.appendChild(removeBtn);
                itemsList.appendChild(tag);
            });
            
            selectionPreviewContainer.appendChild(itemsList);
        };

        const renderModalContent = () => {
            modalPanel.innerHTML = '';

            const createPanelHeader = (title, onBackClick) => {
                const headerContainer = document.createElement('div');
                headerContainer.className = 'flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0';
                const backButton = document.createElement('button');
                if (onBackClick) {
                    backButton.className = 'p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors duration-200';
                    backButton.setAttribute('aria-label', '返回上一層');
                    backButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>`;
                    backButton.onclick = onBackClick;
                } else {
                    backButton.className = 'w-8 h-8'; // Placeholder for alignment
                }
                const headerTitle = document.createElement('p');
                headerTitle.className = 'flex-grow text-center font-bold text-gray-800 text-lg';
                headerTitle.textContent = title;
                const closeButton = document.createElement('button');
                closeButton.className = 'p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors duration-200';
                closeButton.setAttribute('aria-label', '關閉視窗');
                closeButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>`;
                closeButton.onclick = closeModal;
                headerContainer.appendChild(backButton);
                headerContainer.appendChild(headerTitle);
                headerContainer.appendChild(closeButton);
                return headerContainer;
            };

            const modalBody = document.createElement('div');
            modalBody.className = 'p-4 overflow-y-auto custom-scrollbar flex-grow';

            const dateTimeContainer = document.createElement('div');
            dateTimeContainer.className = 'grid grid-cols-2 gap-3 mb-4';
            const entryDate = new Date(timestamp);
            const dateInputContainer = document.createElement('div');
            dateInputContainer.innerHTML = `<label for="edit-date" class="block text-xs font-medium text-gray-600 mb-1">日期</label>`;
            const dateInput = document.createElement('input');
            dateInput.type = 'date';
            dateInput.id = 'edit-date';
            dateInput.className = 'w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500';
            dateInput.value = entryDate.toISOString().split('T')[0];
            dateInputContainer.appendChild(dateInput);

            const timeInputContainer = document.createElement('div');
            timeInputContainer.innerHTML = `<label for="edit-time" class="block text-xs font-medium text-gray-600 mb-1">時間</label>`;
            const timeInput = document.createElement('input');
            timeInput.type = 'time';
            timeInput.id = 'edit-time';
            timeInput.className = 'w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500';
            timeInput.value = entryDate.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
            timeInputContainer.appendChild(timeInput);
            
            dateTimeContainer.appendChild(dateInputContainer);
            dateTimeContainer.appendChild(timeInputContainer);

            if (viewingSubCategoryItems) {
                // This is the ITEM list view.
                let fullTitle = `${category} > ${viewingSubCategoryItems}`;
                 if (category === '飲食' && selectedMealType) {
                    fullTitle = `${selectedMealType} > ${viewingSubCategoryItems}`;
                }
                if (fullTitle.length > 18) {
                    fullTitle = `... > ${viewingSubCategoryItems}`;
                }

                modalPanel.appendChild(createPanelHeader(fullTitle, () => {
                    viewingSubCategoryItems = null;
                    renderModalContent();
                }));
                 
                if (category !== '健康' || viewingSubCategoryItems !== '睡眠') {
                    modalBody.appendChild(dateTimeContainer);
                }

                const quickAddContainer = document.createElement('div');
                quickAddContainer.className = 'space-y-2';

                const allDefaultSubCats = SUBCATEGORIES[category] || [];
                const allCustomSubCats = customItems[category] || [];
                const subCat = [...allDefaultSubCats, ...allCustomSubCats].find(sc => sc.name === viewingSubCategoryItems);

                if (subCat) {
                     if (category === '健康' && subCat.name === '睡眠') {
                        const match = entry.content.match(/\((\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\)/);
                        let bedtimeValue = '22:00';
                        let waketimeValue = '07:00';
                        if (match) {
                           bedtimeValue = match[1];
                           waketimeValue = match[2];
                        }
                        quickAddContainer.appendChild(createSleepInputUI(bedtimeValue, waketimeValue));
                        confirmButton.disabled = false;
                    } else {
                        const defaultItems = (SUBCATEGORIES[category].find(sc => sc.name === subCat.name)?.items || []).sort();
                        const customSubCat = customItems[category]?.find(sc => sc.name === subCat.name);
                        const customItemEntries = customSubCat?.items || [];
                        const combinedItems = [...new Set([...defaultItems, ...customItemEntries])];
                        
                        const itemsGrid = document.createElement('div');
                        itemsGrid.className = 'grid grid-cols-3 gap-2';

                        combinedItems.forEach(item => {
                            const isSelected = selectedItems.has(item);
                            const itemButton = document.createElement('button');
                            itemButton.textContent = item;
                            itemButton.className = `p-2 rounded-lg text-sm transition text-center truncate ${isSelected ? 'bg-blue-500 text-white font-semibold' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`;
                            
                            itemButton.onclick = () => {
                                if (selectedItems.has(item)) {
                                    selectedItems.delete(item);
                                } else {
                                    selectedItems.add(item);
                                }
                                renderModalContent();
                            };

                            const isCustom = !defaultItems.includes(item);
                            if (isCustom) {
                                let pressTimer = null;
                                let longPressTriggered = false;

                                const startPress = (e) => {
                                    longPressTriggered = false;
                                    pressTimer = window.setTimeout(() => {
                                        longPressTriggered = true;
                                        if ('vibrate' in navigator) navigator.vibrate(50);
                                        showCustomItemActionMenu(item, category, subCat.name);
                                    }, 700);
                                };
                                const cancelPress = () => { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } };
                                itemButton.addEventListener('mousedown', startPress);
                                itemButton.addEventListener('touchstart', startPress, { passive: true });
                                itemButton.addEventListener('mouseup', cancelPress);
                                itemButton.addEventListener('mouseleave', cancelPress);
                                itemButton.addEventListener('touchend', cancelPress);
                                itemButton.addEventListener('touchcancel', cancelPress);
                                itemButton.addEventListener('click', (e) => {
                                    if (longPressTriggered) { e.preventDefault(); e.stopPropagation(); }
                                }, true);
                            }

                            if (item === lastAddedItem) {
                                itemButton.classList.add('new-item-highlight');
                                lastAddedItem = null;
                            }
                            
                            itemsGrid.appendChild(itemButton);
                        });
                        
                        quickAddContainer.appendChild(itemsGrid);

                        if (combinedItems.some(item => !defaultItems.includes(item))) {
                            const hintText = document.createElement('p');
                            hintText.className = 'text-xs text-center text-gray-500 pt-3';
                            hintText.textContent = '提示：長按自訂的項目可修改或刪除。';
                            quickAddContainer.appendChild(hintText);
                        }

                        const addCustomItemButton = document.createElement('button');
                        addCustomItemButton.className = 'w-full text-left p-3 mt-2 bg-gray-50 border border-dashed border-gray-400 rounded-lg text-gray-600 hover:bg-gray-100 hover:border-gray-500 hover:text-gray-800 font-semibold flex items-center justify-center transition';
                        addCustomItemButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 mr-2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>新增項目...`;
                        addCustomItemButton.onclick = () => {
                            showCustomInputModal((newItem) => {
                                if (!customItems[category]) { customItems[category] = []; }
                                let targetSubCat = customItems[category].find(sc => sc.name === subCat.name);
                                if (!targetSubCat) {
                                    targetSubCat = { name: subCat.name, items: [] };
                                    customItems[category].push(targetSubCat);
                                }
                                if (!targetSubCat.items.includes(newItem)) {
                                    targetSubCat.items.push(newItem);
                                    saveCustomItems();
                                    selectedItems.add(newItem);
                                    lastAddedItem = newItem;
                                    renderModalContent();
                                }
                            });
                        };
                        quickAddContainer.appendChild(addCustomItemButton);
                        confirmButton.disabled = selectedItems.size === 0;
                    }
                }
                modalBody.appendChild(quickAddContainer);
            } else {
                // This is the SUBCATEGORY list view.
                let headerTitle;
                let subCatsToShow;
                let onBackClick = undefined;

                if (category === '飲食' && selectedMealType) {
                    headerTitle = `記錄 ${selectedMealType} 內容`;
                    subCatsToShow = [...(SUBCATEGORIES[category] || []), ...(customItems[category] || [])];
                    onBackClick = () => {
                        selectedMealType = null;
                        renderModalContent();
                    };
                } else if (category === '飲食' && !selectedMealType) {
                    headerTitle = '選擇餐別';
                    subCatsToShow = [
                        { name: '早餐', items: [] },
                        { name: '中餐', items: [] },
                        { name: '晚餐', items: [] },
                        { name: '點心', items: [] },
                    ];
                } else {
                    headerTitle = `記錄 ${category}`;
                    subCatsToShow = [...(SUBCATEGORIES[category] || []), ...(customItems[category] || [])];
                }

                modalPanel.appendChild(createPanelHeader(headerTitle, onBackClick));
                modalBody.appendChild(dateTimeContainer);
                
                const quickAddContainer = document.createElement('div');
                quickAddContainer.className = 'space-y-2';

                subCatsToShow.forEach(subCat => {
                    const subCatButton = document.createElement('button');
                    subCatButton.className = 'w-full text-left p-3 bg-gray-100 rounded-lg hover:bg-gray-200 font-semibold text-gray-700 flex justify-between items-center transition';
                    subCatButton.innerHTML = `<span>${subCat.name}</span><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5 text-gray-400"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>`;
                    
                    subCatButton.onclick = () => {
                        if (category === '飲食' && !selectedMealType) {
                            selectedMealType = subCat.name;
                        } else {
                            viewingSubCategoryItems = subCat.name;
                        }
                        renderModalContent();
                    };

                    const isDefaultDietSubCat = category === '飲食' && !selectedMealType;
                    const defaultSubCatsForCategory = SUBCATEGORIES[category] || [];
                    const isDefaultSubCat = defaultSubCatsForCategory.some(sc => sc.name === subCat.name);

                    if (!isDefaultDietSubCat && !isDefaultSubCat) { // is a custom subcategory
                        let pressTimer = null;
                        let longPressTriggered = false;

                        const startPress = (e) => {
                            longPressTriggered = false;
                            pressTimer = window.setTimeout(() => {
                                longPressTriggered = true;
                                if ('vibrate' in navigator) { navigator.vibrate(50); }
                                showSubCategoryActionMenu(subCat.name, category);
                            }, 700);
                        };

                        const cancelPress = () => { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } };
                        subCatButton.addEventListener('mousedown', startPress);
                        subCatButton.addEventListener('touchstart', startPress, { passive: true });
                        subCatButton.addEventListener('mouseup', cancelPress);
                        subCatButton.addEventListener('mouseleave', cancelPress);
                        subCatButton.addEventListener('touchend', cancelPress);
                        subCatButton.addEventListener('touchcancel', cancelPress);
                        subCatButton.addEventListener('click', (e) => { if (longPressTriggered) { e.preventDefault(); e.stopPropagation(); } }, true);
                    }
                    quickAddContainer.appendChild(subCatButton);
                });

                const combinedSubCats = [...(SUBCATEGORIES[category] || []), ...(customItems[category] || [])];
                const customSubCatExists = combinedSubCats.some(sc => !(SUBCATEGORIES[category] || []).some(dsc => dsc.name === sc.name));
                if (customSubCatExists) {
                    const hintText = document.createElement('p');
                    hintText.className = 'text-xs text-center text-gray-500 pt-2';
                    hintText.textContent = '提示：長按自訂的子分類可修改或刪除。';
                    quickAddContainer.appendChild(hintText);
                }

                 if (category !== '飲食' || (category === '飲食' && selectedMealType)) {
                    const addSubCategoryButton = document.createElement('button');
                    addSubCategoryButton.className = 'w-full text-left p-3 mt-2 bg-gray-50 border border-dashed border-gray-400 rounded-lg text-gray-600 hover:bg-gray-100 hover:border-gray-500 hover:text-gray-800 font-semibold flex items-center justify-center transition';
                    addSubCategoryButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 mr-2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>新增子分類...`;
                    addSubCategoryButton.onclick = () => {
                        showCustomInputModal((newText) => {
                            const newSubCatName = newText.trim();
                            if (newSubCatName) {
                                if (!customItems[category]) { customItems[category] = []; }
                                const existsInDefault = (SUBCATEGORIES[category] || []).some(sc => sc.name === newSubCatName);
                                const existsInCustom = (customItems[category] || []).some(sc => sc.name === newSubCatName);
                                if (!existsInDefault && !existsInCustom) {
                                    customItems[category].push({ name: newSubCatName, items: [] });
                                    saveCustomItems();
                                    viewingSubCategoryItems = newSubCatName;
                                    renderModalContent();
                                }
                            }
                        }, '新增子分類');
                    };
                    quickAddContainer.appendChild(addSubCategoryButton);
                }
                modalBody.appendChild(quickAddContainer);
            }
            
            if (!selectionPreviewContainer) {
                selectionPreviewContainer = document.createElement('div');
            }
            updateSelectionPreview();
            
            modalPanel.appendChild(selectionPreviewContainer);
            modalPanel.appendChild(modalBody);
            modalPanel.appendChild(footer);
        };

        footer.className = 'p-4 border-t border-gray-200 bg-white flex-shrink-0';
        confirmButton.className = 'w-full py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition disabled:bg-gray-300';
        confirmButton.textContent = '儲存變更';
        confirmButton.disabled = selectedItems.size === 0 && !(category === '健康' && viewingSubCategoryItems === '睡眠');

        confirmButton.onclick = () => {
            let newContent = '';
            let newTimestamp;

            if (category === '健康' && viewingSubCategoryItems === '睡眠') {
                const bedtimeInput = modalPanel.querySelector('#bedtime');
                const waketimeInput = modalPanel.querySelector('#waketime');
                const dateInput = modalPanel.querySelector('#edit-date');
                if (bedtimeInput && waketimeInput && dateInput) {
                    const bedtimeValue = bedtimeInput.value;
                    const waketimeValue = waketimeInput.value;
                    const dateValue = dateInput.value;
                    
                    const wakeUpDate = new Date(`${dateValue}T${waketimeValue}`);
                    let bedTimeDate = new Date(`${dateValue}T${bedtimeValue}`);

                    if (wakeUpDate < bedTimeDate) {
                        bedTimeDate.setDate(bedTimeDate.getDate() - 1);
                    }

                    const durationMs = wakeUpDate.getTime() - bedTimeDate.getTime();
                    const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
                    const durationMinutes = Math.round((durationMs % (1000 * 60 * 60)) / (1000 * 60));
                    
                    newContent = `睡眠 ${durationHours}小時${durationMinutes}分鐘 (${bedtimeValue} - ${waketimeValue})`;
                    newTimestamp = wakeUpDate.getTime();
                } else {
                    return; 
                }
            } else {
                newContent = Array.from(selectedItems).join(', ');
                if (category === '飲食' && selectedMealType) {
                    newContent = `${selectedMealType}: ${newContent}`;
                }
                const dateInput = modalPanel.querySelector('#edit-date');
                const timeInput = modalPanel.querySelector('#edit-time');
                if (dateInput && timeInput) {
                    newTimestamp = new Date(`${dateInput.value}T${timeInput.value}`).getTime();
                } else {
                    // Fallback to original timestamp if inputs are not found.
                    newTimestamp = timestamp;
                }
            }

            if (newContent) {
                updateEntry(id, { content: newContent, timestamp: newTimestamp });
            }
            closeModal();
        };

        footer.appendChild(confirmButton);
        
        modalOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center animate-fade-in-fast';
        modalOverlay.onclick = (e) => {
            if (e.target === modalOverlay) closeModal();
        };

        modalPanel.className = 'bg-gray-50 w-full max-w-md h-[90vh] flex flex-col rounded-t-2xl animate-slide-up';
        
        modalOverlay.appendChild(modalPanel);
        document.body.appendChild(modalOverlay);
        renderModalContent();
    };

    const showActionMenu = (entry) => {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-40 z-50 animate-fade-in-fast';
    
        const panel = document.createElement('div');
        panel.className = 'fixed bottom-0 left-0 right-0 p-2 bg-transparent rounded-t-2xl animate-slide-up max-w-md mx-auto';
        
        const actionsGroup = document.createElement('div');
        actionsGroup.className = 'bg-white/80 backdrop-blur-xl rounded-xl overflow-hidden';
    
        const editButton = document.createElement('button');
        editButton.className = 'w-full p-3 text-center text-blue-500 font-semibold text-lg hover:bg-gray-100 transition';
        editButton.textContent = '編輯記錄';
        editButton.onclick = () => {
            overlay.remove();
            showEditModal(entry);
        };
    
        const deleteButton = document.createElement('button');
        deleteButton.className = 'w-full p-3 text-center text-red-500 font-semibold text-lg hover:bg-gray-100 transition';
        deleteButton.textContent = '刪除記錄';
        deleteButton.onclick = () => {
            overlay.remove();
            showDeleteConfirmation(entry);
        };
        
        const separator = document.createElement('div');
        separator.className = 'h-px bg-gray-300/60';
    
        actionsGroup.appendChild(editButton);
        actionsGroup.appendChild(separator);
        actionsGroup.appendChild(deleteButton);
    
        const cancelButton = document.createElement('button');
        cancelButton.className = 'w-full p-3 mt-2 text-center text-blue-500 font-bold text-lg bg-white/80 backdrop-blur-xl rounded-xl hover:bg-gray-100 transition';
        cancelButton.textContent = '取消';
        cancelButton.onclick = () => overlay.remove();
    
        panel.appendChild(actionsGroup);
        panel.appendChild(cancelButton);
        overlay.appendChild(panel);
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
        };
        document.body.appendChild(overlay);
    };

  if (state.entries.length === 0) {
    container.innerHTML = `
      <div class="text-center text-gray-500 pt-24 flex flex-col items-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 text-gray-400 mb-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
        <p class="text-lg font-semibold text-gray-700 mb-1">今天還沒有任何記錄</p>
        <p class="text-gray-500">點擊下方的「新增」按鈕開始吧！</p>
      </div>
    `;
    return container;
  }
  
  const entriesList = document.createElement('ul');
  entriesList.className = 'space-y-4';
  container.appendChild(entriesList);

  let lastDate = null;
  state.entries.forEach(entry => {
      const entryDateObj = new Date(entry.timestamp);
      const entryDateStr = entryDateObj.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });
      const todayStr = new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });
      const yesterdayStr = new Date(Date.now() - 86400000).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });

      let displayDate = entryDateStr;
      if (entryDateStr === todayStr) {
          displayDate = '今天';
      } else if (entryDateStr === yesterdayStr) {
          displayDate = '昨天';
      }

      if (displayDate !== lastDate) {
          const dateHeader = document.createElement('h2');
          dateHeader.className = `text-3xl font-bold text-gray-900 ${lastDate !== null ? 'pt-6' : 'pt-2'} pb-2`;
          dateHeader.textContent = displayDate;
          entriesList.appendChild(dateHeader);
          lastDate = displayDate;
          
          const yyyymmdd = entryDateObj.toISOString().split('T')[0];
          const dailyInfo = state.dailyInfo[yyyymmdd];
          
          if (dailyInfo) {
              const infoEl = document.createElement('p');
              infoEl.className = 'text-sm text-gray-500 pb-2 -mt-1';
              infoEl.textContent = `📍 ${dailyInfo.location} | ${dailyInfo.weather.icon} ${Math.round(dailyInfo.weather.temp)}°C ${dailyInfo.weather.description}`;
              dateHeader.insertAdjacentElement('afterend', infoEl);
          }
      }

      const config = CATEGORY_CONFIG[entry.category];
      const card = document.createElement('li');
      card.className = `bg-white p-3 rounded-xl flex items-start space-x-4 noselect`;
      const time = entryDateObj.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });

      card.innerHTML = `
          <div class="flex-shrink-0 pt-1" style="color: ${config.hexColor};">${config.icon}</div>
          <div class="flex-1">
              <div class="flex justify-between items-baseline">
                  <p class="font-semibold text-gray-800">${entry.category}</p>
                  <p class="text-sm text-gray-400">${time}</p>
              </div>
              <p class="text-gray-600 whitespace-pre-wrap mt-0.5">${entry.content}</p>
          </div>
      `;
      
      let pressTimer = null;
      let longPressTriggered = false;

      const startPress = (e) => {
          longPressTriggered = false;
          pressTimer = window.setTimeout(() => {
              longPressTriggered = true;
              if ('vibrate' in navigator) {
                  navigator.vibrate(50);
              }
              showActionMenu(entry);
          }, 700);
      };

      const cancelPress = () => {
          if (pressTimer) {
              clearTimeout(pressTimer);
              pressTimer = null;
          }
      };
      
      card.addEventListener('mousedown', startPress);
      card.addEventListener('touchstart', startPress, { passive: true });
      card.addEventListener('mouseup', cancelPress);
      card.addEventListener('mouseleave', cancelPress);
      card.addEventListener('touchend', cancelPress);
      card.addEventListener('touchcancel', cancelPress);
      card.addEventListener('touchmove', cancelPress);
      
      card.addEventListener('click', (e) => {
        if (longPressTriggered) {
          e.preventDefault();
          e.stopPropagation();
        }
      }, true);

      entriesList.appendChild(card);
  });

  const hint = document.createElement('p');
  hint.className = 'text-center text-xs text-gray-400 mt-6 pb-4';
  hint.textContent = '提示：長按日誌項目可開啟編輯或刪除選單。';
  container.appendChild(hint);

  return container;
}

let selectedDate = new Date().toISOString().split('T')[0];

export function AddEntryView() {
    const container = document.createElement('div');
    container.className = 'p-4 space-y-5';
    
    const showCustomInputModal = (onConfirm, title = '新增自訂項目') => {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4 animate-fade-in-fast';
        
        const panel = document.createElement('div');
        panel.className = 'bg-white rounded-xl shadow-xl w-full max-w-xs animate-slide-up flex flex-col';

        const header = document.createElement('div');
        header.className = 'p-3 border-b';
        header.innerHTML = `<h3 class="font-semibold text-center text-gray-800">${title}</h3>`;
        
        const body = document.createElement('div');
        body.className = 'p-4';
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
        input.placeholder = '請輸入內容...';
        input.onkeydown = (e) => {
            if (e.key === 'Enter') confirmButton.click();
        };
        body.appendChild(input);

        const footer = document.createElement('div');
        footer.className = 'p-2 bg-gray-50 grid grid-cols-2 gap-2';
        
        const cancelButton = document.createElement('button');
        cancelButton.className = 'px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition';
        cancelButton.textContent = '取消';
        cancelButton.onclick = () => overlay.remove();

        const confirmButton = document.createElement('button');
        confirmButton.className = 'px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition';
        confirmButton.textContent = '確認';
        confirmButton.onclick = () => {
            const value = input.value.trim();
            if (value) {
                onConfirm(value);
            }
            overlay.remove();
        };

        footer.appendChild(cancelButton);
        footer.appendChild(confirmButton);
        panel.appendChild(header);
        panel.appendChild(body);
        panel.appendChild(footer);
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
        };
        overlay.appendChild(panel);
        document.body.appendChild(overlay);
        setTimeout(() => input.focus(), 50);
    };

    const showEntryModal = (category) => {
        const selectedItems = new Set();
        let selectedMealType = null;
        let viewingSubCategoryItems = null;
        let lastAddedItem = null;

        const modalOverlay = document.createElement('div');
        const modalPanel = document.createElement('div');
        const footer = document.createElement('div');
        const confirmButton = document.createElement('button');

        let selectionPreviewContainer = null;
        
        const closeModal = () => modalOverlay.remove();

        const showDeleteItemConfirmation = (itemName, cat, subCatName) => {
            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70] p-4 animate-fade-in-fast';

            const panel = document.createElement('div');
            panel.className = 'bg-white rounded-xl shadow-xl w-full max-w-xs animate-slide-up flex flex-col';

            const header = document.createElement('div');
            header.className = 'p-3 border-b';
            header.innerHTML = `<h3 class="font-semibold text-center text-red-600">確認刪除</h3>`;

            const body = document.createElement('div');
            body.className = 'p-4 text-center';
            body.innerHTML = `您確定要刪除「<strong class="text-red-700">${itemName}</strong>」嗎？<br><span class="text-sm text-gray-500">此操作無法復原。</span>`;

            const footer = document.createElement('div');
            footer.className = 'p-2 bg-gray-50 grid grid-cols-2 gap-2';

            const cancelButton = document.createElement('button');
            cancelButton.className = 'px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition';
            cancelButton.textContent = '取消';
            cancelButton.onclick = () => overlay.remove();

            const confirmButton = document.createElement('button');
            confirmButton.className = 'px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition';
            confirmButton.textContent = '刪除';
            confirmButton.onclick = () => {
                if (customItems[cat]) {
                    const targetSubCat = customItems[cat].find(sc => sc.name === subCatName);
                    if (targetSubCat) {
                        targetSubCat.items = targetSubCat.items.filter(i => i !== itemName);
                        saveCustomItems();
                    }
                }
                
                if (selectedItems.has(itemName)) {
                    selectedItems.delete(itemName);
                }

                overlay.remove();
                renderModalContent();
            };

            footer.appendChild(cancelButton);
            footer.appendChild(confirmButton);
            panel.appendChild(header);
            panel.appendChild(body);
            panel.appendChild(footer);
            overlay.onclick = (e) => {
                if (e.target === overlay) overlay.remove();
            };
            overlay.appendChild(panel);
            document.body.appendChild(overlay);
        };

        const showDeleteSubCategoryConfirmation = (subCatName, cat) => {
            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70] p-4 animate-fade-in-fast';

            const panel = document.createElement('div');
            panel.className = 'bg-white rounded-xl shadow-xl w-full max-w-xs animate-slide-up flex flex-col';

            const header = document.createElement('div');
            header.className = 'p-3 border-b';
            header.innerHTML = `<h3 class="font-semibold text-center text-red-600">確認刪除子分類</h3>`;

            const body = document.createElement('div');
            body.className = 'p-4 text-center';
            body.innerHTML = `您確定要刪除「<strong class="text-red-700">${subCatName}</strong>」子分類嗎？<br><span class="text-sm text-gray-500">所有在此分類下的自訂項目也將被刪除。</span>`;

            const footer = document.createElement('div');
            footer.className = 'p-2 bg-gray-50 grid grid-cols-2 gap-2';

            const cancelButton = document.createElement('button');
            cancelButton.className = 'px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition';
            cancelButton.textContent = '取消';
            cancelButton.onclick = () => overlay.remove();

            const confirmButton = document.createElement('button');
            confirmButton.className = 'px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition';
            confirmButton.textContent = '刪除';
            confirmButton.onclick = () => {
                if (customItems[cat]) {
                    customItems[cat] = customItems[cat].filter(sc => sc.name !== subCatName);
                    saveCustomItems();
                }
                overlay.remove();
                renderModalContent();
            };

            footer.appendChild(cancelButton);
            footer.appendChild(confirmButton);
            panel.appendChild(header);
            panel.appendChild(body);
            panel.appendChild(footer);
            overlay.onclick = (e) => {
                if (e.target === overlay) overlay.remove();
            };
            overlay.appendChild(panel);
            document.body.appendChild(overlay);
        };

        const showEditSubCategoryModal = (oldSubCatName, category) => {
            const onConfirm = (newSubCatName) => {
                if (!customItems[category]) return;
                const targetSubCat = customItems[category].find(sc => sc.name === oldSubCatName);
                if (targetSubCat) {
                    targetSubCat.name = newSubCatName;
                    saveCustomItems();
                    if (viewingSubCategoryItems === oldSubCatName) {
                        viewingSubCategoryItems = newSubCatName;
                    }
                    renderModalContent();
                }
            };
            
            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[90] p-4 animate-fade-in-fast';
            
            const panel = document.createElement('div');
            panel.className = 'bg-white rounded-xl shadow-xl w-full max-w-xs animate-slide-up flex flex-col';
        
            const header = document.createElement('div');
            header.className = 'p-3 border-b';
            header.innerHTML = `<h3 class="font-semibold text-center text-gray-800">修改子分類名稱</h3>`;
            
            const body = document.createElement('div');
            body.className = 'p-4';
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
            input.value = oldSubCatName;
            input.onkeydown = (e) => { if (e.key === 'Enter') confirmButton.click(); };
            body.appendChild(input);
        
            const footer = document.createElement('div');
            footer.className = 'p-2 bg-gray-50 grid grid-cols-2 gap-2';
            
            const cancelButton = document.createElement('button');
            cancelButton.className = 'px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition';
            cancelButton.textContent = '取消';
            cancelButton.onclick = () => overlay.remove();
        
            const confirmButton = document.createElement('button');
            confirmButton.className = 'px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition';
            confirmButton.textContent = '儲存';
            confirmButton.onclick = () => {
                const value = input.value.trim();
                if (value && value !== oldSubCatName) {
                    const isDuplicate = (SUBCATEGORIES[category]?.some(sc => sc.name === value)) ||
                                        (customItems[category]?.some(sc => sc.name === value));
                     if (!isDuplicate) {
                         onConfirm(value);
                     }
                }
                overlay.remove();
            };
        
            footer.appendChild(cancelButton);
            footer.appendChild(confirmButton);
            panel.appendChild(header);
            panel.appendChild(body);
            panel.appendChild(footer);
            overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
            overlay.appendChild(panel);
            document.body.appendChild(overlay);
            setTimeout(() => { input.focus(); input.select(); }, 50);
        };

        const showSubCategoryActionMenu = (subCatName, category) => {
            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 bg-black bg-opacity-40 z-[80] animate-fade-in-fast';
        
            const panel = document.createElement('div');
            panel.className = 'fixed bottom-0 left-0 right-0 p-2 bg-transparent rounded-t-2xl animate-slide-up max-w-md mx-auto';
            
            const actionsGroup = document.createElement('div');
            actionsGroup.className = 'bg-white/80 backdrop-blur-xl rounded-xl overflow-hidden';
        
            const editButton = document.createElement('button');
            editButton.className = 'w-full p-3 text-center text-blue-500 font-semibold text-lg hover:bg-gray-100 transition';
            editButton.textContent = '修改名稱';
            editButton.onclick = () => {
                overlay.remove();
                showEditSubCategoryModal(subCatName, category);
            };
        
            const deleteButton = document.createElement('button');
            deleteButton.className = 'w-full p-3 text-center text-red-500 font-semibold text-lg hover:bg-gray-100 transition';
            deleteButton.textContent = '刪除分類';
            deleteButton.onclick = () => {
                overlay.remove();
                showDeleteSubCategoryConfirmation(subCatName, category);
            };
            
            const separator = document.createElement('div');
            separator.className = 'h-px bg-gray-300/60';
        
            actionsGroup.appendChild(editButton);
            actionsGroup.appendChild(separator);
            actionsGroup.appendChild(deleteButton);
        
            const cancelButton = document.createElement('button');
            cancelButton.className = 'w-full p-3 mt-2 text-center text-blue-500 font-bold text-lg bg-white/80 backdrop-blur-xl rounded-xl hover:bg-gray-100 transition';
            cancelButton.textContent = '取消';
            cancelButton.onclick = () => overlay.remove();
        
            panel.appendChild(actionsGroup);
            panel.appendChild(cancelButton);
            overlay.appendChild(panel);
            overlay.onclick = (e) => {
                if (e.target === overlay) overlay.remove();
            };
            document.body.appendChild(overlay);
        };
        
        const showEditCustomItemModal = (oldItemName, category, subCatName) => {
            const onConfirm = (newItemName) => {
                if (!customItems[category]) return;
                const targetSubCat = customItems[category].find(sc => sc.name === subCatName);
                if (targetSubCat) {
                    const itemIndex = targetSubCat.items.indexOf(oldItemName);
                    if (itemIndex > -1) {
                        targetSubCat.items[itemIndex] = newItemName;
                        if (selectedItems.has(oldItemName)) {
                            selectedItems.delete(oldItemName);
                            selectedItems.add(newItemName);
                        }
                        saveCustomItems();
                        renderModalContent();
                    }
                }
            };
            
            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[90] p-4 animate-fade-in-fast';
            
            const panel = document.createElement('div');
            panel.className = 'bg-white rounded-xl shadow-xl w-full max-w-xs animate-slide-up flex flex-col';
        
            const header = document.createElement('div');
            header.className = 'p-3 border-b';
            header.innerHTML = `<h3 class="font-semibold text-center text-gray-800">修改項目</h3>`;
            
            const body = document.createElement('div');
            body.className = 'p-4';
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
            input.value = oldItemName;
            input.onkeydown = (e) => { if (e.key === 'Enter') confirmButton.click(); };
            body.appendChild(input);
        
            const footer = document.createElement('div');
            footer.className = 'p-2 bg-gray-50 grid grid-cols-2 gap-2';
            
            const cancelButton = document.createElement('button');
            cancelButton.className = 'px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition';
            cancelButton.textContent = '取消';
            cancelButton.onclick = () => overlay.remove();
        
            const confirmButton = document.createElement('button');
            confirmButton.className = 'px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition';
            confirmButton.textContent = '儲存';
            confirmButton.onclick = () => {
                const value = input.value.trim();
                if (value && value !== oldItemName) {
                    let isDuplicate = false;
                    if (customItems[category]) {
                        const targetSubCat = customItems[category].find(sc => sc.name === subCatName);
                        if (targetSubCat && targetSubCat.items.includes(value)) {
                            isDuplicate = true;
                        }
                    }
                     if (!isDuplicate) {
                         onConfirm(value);
                     }
                }
                overlay.remove();
            };
        
            footer.appendChild(cancelButton);
            footer.appendChild(confirmButton);
            panel.appendChild(header);
            panel.appendChild(body);
            panel.appendChild(footer);
            overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
            overlay.appendChild(panel);
            document.body.appendChild(overlay);
            setTimeout(() => { input.focus(); input.select(); }, 50);
        };

        const showCustomItemActionMenu = (itemName, category, subCatName) => {
            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 bg-black bg-opacity-40 z-[80] animate-fade-in-fast';
        
            const panel = document.createElement('div');
            panel.className = 'fixed bottom-0 left-0 right-0 p-2 bg-transparent rounded-t-2xl animate-slide-up max-w-md mx-auto';
            
            const actionsGroup = document.createElement('div');
            actionsGroup.className = 'bg-white/80 backdrop-blur-xl rounded-xl overflow-hidden';
        
            const editButton = document.createElement('button');
            editButton.className = 'w-full p-3 text-center text-blue-500 font-semibold text-lg hover:bg-gray-100 transition';
            editButton.textContent = '修改項目';
            editButton.onclick = () => {
                overlay.remove();
                showEditCustomItemModal(itemName, category, subCatName);
            };
        
            const deleteButton = document.createElement('button');
            deleteButton.className = 'w-full p-3 text-center text-red-500 font-semibold text-lg hover:bg-gray-100 transition';
            deleteButton.textContent = '刪除項目';
            deleteButton.onclick = () => {
                overlay.remove();
                showDeleteItemConfirmation(itemName, category, subCatName);
            };
            
            const separator = document.createElement('div');
            separator.className = 'h-px bg-gray-300/60';
        
            actionsGroup.appendChild(editButton);
            actionsGroup.appendChild(separator);
            actionsGroup.appendChild(deleteButton);
        
            const cancelButton = document.createElement('button');
            cancelButton.className = 'w-full p-3 mt-2 text-center text-blue-500 font-bold text-lg bg-white/80 backdrop-blur-xl rounded-xl hover:bg-gray-100 transition';
            cancelButton.textContent = '取消';
            cancelButton.onclick = () => overlay.remove();
        
            panel.appendChild(actionsGroup);
            panel.appendChild(cancelButton);
            overlay.appendChild(panel);
            overlay.onclick = (e) => {
                if (e.target === overlay) overlay.remove();
            };
            document.body.appendChild(overlay);
        };

        const updateSelectionPreview = () => {
            if (!selectionPreviewContainer) return;
            selectionPreviewContainer.innerHTML = '';
            
            if (category === '健康' && viewingSubCategoryItems === '睡眠') {
                selectionPreviewContainer.className = 'p-3 border-b border-gray-200 bg-white text-center text-gray-500 text-sm';
                selectionPreviewContainer.textContent = '請輸入就寢與起床時間';
                return;
            }

            if (selectedItems.size === 0) {
                selectionPreviewContainer.className = 'p-3 border-b border-gray-200 bg-white text-center text-gray-500 text-sm';
                selectionPreviewContainer.textContent = '尚未選擇任何項目';
                return;
            }
            
            selectionPreviewContainer.className = 'p-3 border-b border-gray-200 bg-white max-h-32 overflow-y-auto custom-scrollbar';
            const title = document.createElement('p');
            title.className = 'text-xs font-semibold text-gray-600 mb-2';
            title.textContent = `已選擇 ${selectedItems.size} 個項目：`;
            selectionPreviewContainer.appendChild(title);

            const itemsList = document.createElement('div');
            itemsList.className = 'flex flex-wrap gap-2';
            
            Array.from(selectedItems).forEach(item => {
                const tag = document.createElement('span');
                tag.className = 'bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full flex items-center';
                
                const textSpan = document.createElement('span');
                textSpan.textContent = item;
                tag.appendChild(textSpan);
                
                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'ml-1.5 -mr-0.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-blue-600 hover:bg-blue-200 hover:text-blue-800 transition-colors';
                removeBtn.setAttribute('aria-label', `移除 ${item}`);
                removeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-3 h-3"><path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" /></svg>`;
                removeBtn.onclick = (e) => {
                    e.stopPropagation();
                    selectedItems.delete(item);
                    renderModalContent();
                };
                tag.appendChild(removeBtn);
                itemsList.appendChild(tag);
            });
            
            selectionPreviewContainer.appendChild(itemsList);
        };

        const renderModalContent = () => {
            modalPanel.innerHTML = '';

            const createPanelHeader = (title, onBackClick) => {
                const headerContainer = document.createElement('div');
                headerContainer.className = 'flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0';
                const backButton = document.createElement('button');
                if (onBackClick) {
                    backButton.className = 'p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors duration-200';
                    backButton.setAttribute('aria-label', '返回上一層');
                    backButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>`;
                    backButton.onclick = onBackClick;
                } else {
                    backButton.className = 'w-8 h-8'; // Placeholder for alignment
                }
                const headerTitle = document.createElement('p');
                headerTitle.className = 'flex-grow text-center font-bold text-gray-800 text-lg';
                headerTitle.textContent = title;
                const closeButton = document.createElement('button');
                closeButton.className = 'p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors duration-200';
                closeButton.setAttribute('aria-label', '關閉視窗');
                closeButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>`;
                closeButton.onclick = closeModal;
                headerContainer.appendChild(backButton);
                headerContainer.appendChild(headerTitle);
                headerContainer.appendChild(closeButton);
                return headerContainer;
            };

            const modalBody = document.createElement('div');
            modalBody.className = 'p-4 overflow-y-auto custom-scrollbar flex-grow';

            if (viewingSubCategoryItems) {
                // This is the ITEM list view.
                let fullTitle = `${category} > ${viewingSubCategoryItems}`;
                 if (category === '飲食' && selectedMealType) {
                    fullTitle = `${selectedMealType} > ${viewingSubCategoryItems}`;
                }
                if (fullTitle.length > 18) {
                    fullTitle = `... > ${viewingSubCategoryItems}`;
                }

                modalPanel.appendChild(createPanelHeader(fullTitle, () => {
                    viewingSubCategoryItems = null;
                    renderModalContent();
                }));

                const quickAddContainer = document.createElement('div');
                quickAddContainer.className = 'space-y-2';

                const allDefaultSubCats = SUBCATEGORIES[category] || [];
                const allCustomSubCats = customItems[category] || [];
                const subCat = [...allDefaultSubCats, ...allCustomSubCats].find(sc => sc.name === viewingSubCategoryItems);

                if (subCat) {
                     if (category === '健康' && subCat.name === '睡眠') {
                        quickAddContainer.appendChild(createSleepInputUI());
                        confirmButton.disabled = false;
                    } else {
                        const defaultItems = (SUBCATEGORIES[category].find(sc => sc.name === subCat.name)?.items || []).sort();
                        const customSubCat = customItems[category]?.find(sc => sc.name === subCat.name);
                        const customItemEntries = customSubCat?.items || [];
                        const combinedItems = [...new Set([...defaultItems, ...customItemEntries])];
                        
                        const itemsGrid = document.createElement('div');
                        itemsGrid.className = 'grid grid-cols-3 gap-2';

                        combinedItems.forEach(item => {
                            const isSelected = selectedItems.has(item);
                            const itemButton = document.createElement('button');
                            itemButton.textContent = item;
                            itemButton.className = `p-2 rounded-lg text-sm transition text-center truncate ${isSelected ? 'bg-blue-500 text-white font-semibold' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`;
                            
                            itemButton.onclick = () => {
                                if (selectedItems.has(item)) {
                                    selectedItems.delete(item);
                                } else {
                                    selectedItems.add(item);
                                }
                                renderModalContent();
                            };

                            const isCustom = !defaultItems.includes(item);
                            if (isCustom) {
                                let pressTimer = null;
                                let longPressTriggered = false;

                                const startPress = (e) => {
                                    longPressTriggered = false;
                                    pressTimer = window.setTimeout(() => {
                                        longPressTriggered = true;
                                        if ('vibrate' in navigator) navigator.vibrate(50);
                                        showCustomItemActionMenu(item, category, subCat.name);
                                    }, 700);
                                };
                                const cancelPress = () => { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } };
                                itemButton.addEventListener('mousedown', startPress);
                                itemButton.addEventListener('touchstart', startPress, { passive: true });
                                itemButton.addEventListener('mouseup', cancelPress);
                                itemButton.addEventListener('mouseleave', cancelPress);
                                itemButton.addEventListener('touchend', cancelPress);
                                itemButton.addEventListener('touchcancel', cancelPress);
                                itemButton.addEventListener('click', (e) => {
                                    if (longPressTriggered) { e.preventDefault(); e.stopPropagation(); }
                                }, true);
                            }

                            if (item === lastAddedItem) {
                                itemButton.classList.add('new-item-highlight');
                                lastAddedItem = null;
                            }
                            
                            itemsGrid.appendChild(itemButton);
                        });
                        
                        quickAddContainer.appendChild(itemsGrid);

                        if (combinedItems.some(item => !defaultItems.includes(item))) {
                            const hintText = document.createElement('p');
                            hintText.className = 'text-xs text-center text-gray-500 pt-3';
                            hintText.textContent = '提示：長按自訂的項目可修改或刪除。';
                            quickAddContainer.appendChild(hintText);
                        }

                        const addCustomItemButton = document.createElement('button');
                        addCustomItemButton.className = 'w-full text-left p-3 mt-2 bg-gray-50 border border-dashed border-gray-400 rounded-lg text-gray-600 hover:bg-gray-100 hover:border-gray-500 hover:text-gray-800 font-semibold flex items-center justify-center transition';
                        addCustomItemButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 mr-2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>新增項目...`;
                        addCustomItemButton.onclick = () => {
                            showCustomInputModal((newItem) => {
                                if (!customItems[category]) { customItems[category] = []; }
                                let targetSubCat = customItems[category].find(sc => sc.name === subCat.name);
                                if (!targetSubCat) {
                                    targetSubCat = { name: subCat.name, items: [] };
                                    customItems[category].push(targetSubCat);
                                }
                                if (!targetSubCat.items.includes(newItem)) {
                                    targetSubCat.items.push(newItem);
                                    saveCustomItems();
                                    selectedItems.add(newItem);
                                    lastAddedItem = newItem;
                                    renderModalContent();
                                }
                            });
                        };
                        quickAddContainer.appendChild(addCustomItemButton);
                        confirmButton.disabled = selectedItems.size === 0;
                    }
                }
                modalBody.appendChild(quickAddContainer);
            } else {
                // This is the SUBCATEGORY list view.
                let headerTitle;
                let subCatsToShow;
                let onBackClick = undefined;

                if (category === '飲食' && selectedMealType) {
                    headerTitle = `記錄 ${selectedMealType} 內容`;
                    subCatsToShow = [...(SUBCATEGORIES[category] || []), ...(customItems[category] || [])];
                    onBackClick = () => {
                        selectedMealType = null;
                        renderModalContent();
                    };
                } else if (category === '飲食' && !selectedMealType) {
                    headerTitle = '選擇餐別';
                    subCatsToShow = [
                        { name: '早餐', items: [] },
                        { name: '中餐', items: [] },
                        { name: '晚餐', items: [] },
                        { name: '點心', items: [] },
                    ];
                } else {
                    headerTitle = `記錄 ${category}`;
                    subCatsToShow = [...(SUBCATEGORIES[category] || []), ...(customItems[category] || [])];
                }

                modalPanel.appendChild(createPanelHeader(headerTitle, onBackClick));
                
                const quickAddContainer = document.createElement('div');
                quickAddContainer.className = 'space-y-2';

                subCatsToShow.forEach(subCat => {
                    const subCatButton = document.createElement('button');
                    subCatButton.className = 'w-full text-left p-3 bg-gray-100 rounded-lg hover:bg-gray-200 font-semibold text-gray-700 flex justify-between items-center transition';
                    subCatButton.innerHTML = `<span>${subCat.name}</span><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5 text-gray-400"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>`;
                    
                    subCatButton.onclick = () => {
                        if (category === '飲食' && !selectedMealType) {
                            selectedMealType = subCat.name;
                        } else {
                            viewingSubCategoryItems = subCat.name;
                        }
                        renderModalContent();
                    };

                    const isDefaultDietSubCat = category === '飲食' && !selectedMealType;
                    const defaultSubCatsForCategory = SUBCATEGORIES[category] || [];
                    const isDefaultSubCat = defaultSubCatsForCategory.some(sc => sc.name === subCat.name);

                    if (!isDefaultDietSubCat && !isDefaultSubCat) { // is a custom subcategory
                        let pressTimer = null;
                        let longPressTriggered = false;

                        const startPress = (e) => {
                            longPressTriggered = false;
                            pressTimer = window.setTimeout(() => {
                                longPressTriggered = true;
                                if ('vibrate' in navigator) { navigator.vibrate(50); }
                                showSubCategoryActionMenu(subCat.name, category);
                            }, 700);
                        };

                        const cancelPress = () => { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } };
                        subCatButton.addEventListener('mousedown', startPress);
                        subCatButton.addEventListener('touchstart', startPress, { passive: true });
                        subCatButton.addEventListener('mouseup', cancelPress);
                        subCatButton.addEventListener('mouseleave', cancelPress);
                        subCatButton.addEventListener('touchend', cancelPress);
                        subCatButton.addEventListener('touchcancel', cancelPress);
                        subCatButton.addEventListener('click', (e) => { if (longPressTriggered) { e.preventDefault(); e.stopPropagation(); } }, true);
                    }
                    quickAddContainer.appendChild(subCatButton);
                });

                const combinedSubCats = [...(SUBCATEGORIES[category] || []), ...(customItems[category] || [])];
                const customSubCatExists = combinedSubCats.some(sc => !(SUBCATEGORIES[category] || []).some(dsc => dsc.name === sc.name));
                if (customSubCatExists) {
                    const hintText = document.createElement('p');
                    hintText.className = 'text-xs text-center text-gray-500 pt-2';
                    hintText.textContent = '提示：長按自訂的子分類可修改或刪除。';
                    quickAddContainer.appendChild(hintText);
                }

                 if (category !== '飲食' || (category === '飲食' && selectedMealType)) {
                    const addSubCategoryButton = document.createElement('button');
                    addSubCategoryButton.className = 'w-full text-left p-3 mt-2 bg-gray-50 border border-dashed border-gray-400 rounded-lg text-gray-600 hover:bg-gray-100 hover:border-gray-500 hover:text-gray-800 font-semibold flex items-center justify-center transition';
                    addSubCategoryButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 mr-2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>新增子分類...`;
                    addSubCategoryButton.onclick = () => {
                        showCustomInputModal((newText) => {
                            const newSubCatName = newText.trim();
                            if (newSubCatName) {
                                if (!customItems[category]) { customItems[category] = []; }
                                const existsInDefault = (SUBCATEGORIES[category] || []).some(sc => sc.name === newSubCatName);
                                const existsInCustom = (customItems[category] || []).some(sc => sc.name === newSubCatName);
                                if (!existsInDefault && !existsInCustom) {
                                    customItems[category].push({ name: newSubCatName, items: [] });
                                    saveCustomItems();
                                    viewingSubCategoryItems = newSubCatName;
                                    renderModalContent();
                                }
                            }
                        }, '新增子分類');
                    };
                    quickAddContainer.appendChild(addSubCategoryButton);
                }
                modalBody.appendChild(quickAddContainer);
            }
            
            if (!selectionPreviewContainer) {
                selectionPreviewContainer = document.createElement('div');
            }
            updateSelectionPreview();
            
            modalPanel.appendChild(selectionPreviewContainer);
            modalPanel.appendChild(modalBody);
            modalPanel.appendChild(footer);
        };

        footer.className = 'p-4 border-t border-gray-200 bg-white flex-shrink-0';
        confirmButton.className = 'w-full py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition disabled:bg-gray-300';
        confirmButton.textContent = '新增記錄';
        confirmButton.disabled = true;
        confirmButton.onclick = () => {
            let content = '';
            let timestamp;

            if (category === '健康' && viewingSubCategoryItems === '睡眠') {
                const bedtimeInput = modalPanel.querySelector('#bedtime');
                const waketimeInput = modalPanel.querySelector('#waketime');
                if (bedtimeInput && waketimeInput) {
                    const bedtimeValue = bedtimeInput.value;
                    const waketimeValue = waketimeInput.value;
                    const dateValue = selectedDate;
                    
                    const wakeUpDate = new Date(`${dateValue}T${waketimeValue}`);
                    let bedTimeDate = new Date(`${dateValue}T${bedtimeValue}`);

                    if (wakeUpDate < bedTimeDate) {
                        bedTimeDate.setDate(bedTimeDate.getDate() - 1);
                    }

                    const durationMs = wakeUpDate.getTime() - bedTimeDate.getTime();
                    const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
                    const durationMinutes = Math.round((durationMs % (1000 * 60 * 60)) / (1000 * 60));
                    
                    content = `睡眠 ${durationHours}小時${durationMinutes}分鐘 (${bedtimeValue} - ${waketimeValue})`;
                    timestamp = wakeUpDate.getTime();
                } else {
                    return; 
                }
            } else {
                content = Array.from(selectedItems).join(', ');
                if (category === '飲食' && selectedMealType) {
                    content = `${selectedMealType}: ${content}`;
                }
                const dateParts = selectedDate.split('-').map(Number);
                const now = new Date();
                timestamp = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], now.getHours(), now.getMinutes(), now.getSeconds()).getTime();
            }

            if (content) {
                addEntry(category, content, timestamp);
            }
            closeModal();
        };

        footer.appendChild(confirmButton);
        
        modalOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center animate-fade-in-fast';
        modalOverlay.onclick = (e) => {
            if (e.target === modalOverlay) closeModal();
        };

        modalPanel.className = 'bg-gray-50 w-full max-w-md h-[90vh] flex flex-col rounded-t-2xl animate-slide-up';
        
        modalOverlay.appendChild(modalPanel);
        document.body.appendChild(modalOverlay);
        renderModalContent();
    };


    const dateContainer = document.createElement('div');
    dateContainer.className = 'bg-white p-3 rounded-lg shadow-sm';
    dateContainer.innerHTML = `
        <label for="date-picker" class="block text-sm font-medium text-gray-700">選擇日期</label>
        <input type="date" id="date-picker" name="date-picker" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-lg">
    `;
    const dateInput = dateContainer.querySelector('#date-picker');
    dateInput.value = selectedDate;

    const dailyInfoContainer = document.createElement('div');
    dailyInfoContainer.className = 'text-sm text-gray-500 mt-2 h-5'; // Reserve space

    const fetchAndDisplayDailyInfo = async () => {
        const today = new Date().toISOString().split('T')[0];
        if (selectedDate !== today) {
            dailyInfoContainer.innerHTML = '';
            return;
        }

        if (state.dailyInfo[today]) {
            const info = state.dailyInfo[today];
            dailyInfoContainer.innerHTML = `📍 ${info.location} | ${info.weather.icon} ${Math.round(info.weather.temp)}°C ${info.weather.description}`;
            return;
        }
        
        dailyInfoContainer.innerHTML = '正在取得地點與天氣資訊...';

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
            });
            const { latitude, longitude } = position.coords;
            
            // Fetch location name (reverse geocoding)
            const geoResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=zh-TW`);
            if (!geoResponse.ok) {
                const errorText = await geoResponse.text().catch(() => `Status: ${geoResponse.status}`);
                throw new Error(`地點服務錯誤: ${errorText}`);
            }
            const geoData = await geoResponse.json();
            if (geoData.error) {
                throw new Error(geoData.error);
            }
            if (!geoData.address) {
                throw new Error('無法從座標解析地點，請稍後再試');
            }
            const location = geoData.address.city || geoData.address.town || geoData.address.village || '未知地點';

            // Fetch weather
            const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`);
            if (!weatherResponse.ok) {
                const errorText = await weatherResponse.text().catch(() => `Status: ${weatherResponse.status}`);
                throw new Error(`天氣服務錯誤: ${errorText}`);
            }
            const weatherData = await weatherResponse.json();
            if (weatherData.error && weatherData.reason) {
                throw new Error(weatherData.reason);
            }
            if (!weatherData || !weatherData.current || typeof weatherData.current.temperature_2m === 'undefined' || typeof weatherData.current.weather_code === 'undefined') {
                 throw new Error('天氣資料格式不正確，請稍後再試');
            }
            const temp = weatherData.current.temperature_2m;
            const weatherCode = weatherData.current.weather_code;
            const weatherDisplay = getWeatherDisplayInfo(weatherCode);

            const newDailyInfo = {
                location,
                weather: { temp, description: weatherDisplay.description, icon: weatherDisplay.icon, code: weatherCode }
            };

            setDailyInfo(today, newDailyInfo);
            dailyInfoContainer.innerHTML = `📍 ${newDailyInfo.location} | ${newDailyInfo.weather.icon} ${Math.round(newDailyInfo.weather.temp)}°C ${newDailyInfo.weather.description}`;

        } catch (error) {
            let errorMessageForConsole = "Unknown error";
            if (error instanceof Error) {
                errorMessageForConsole = error.message;
            } else if (error && typeof error === 'object' && 'message' in error) {
                errorMessageForConsole = String(error.message);
            } else if (typeof error === 'string') {
                errorMessageForConsole = error;
            }
            console.error("無法取得每日資訊:", errorMessageForConsole, error);
            
            let finalMessage = '無法取得地點與天氣資訊，請稍後再試。';

            // Check for GeolocationPositionError properties
            if (error && typeof error === 'object' && 'code' in error && 'message' in error && typeof error.code === 'number') {
                const geoError = error;
                 switch (geoError.code) {
                    case 1: finalMessage = '請開啟定位權限以取得天氣資訊'; break;
                    case 2: finalMessage = '暫時無法取得您的位置'; break;
                    case 3: finalMessage = '取得位置資訊逾時'; break;
                    default: finalMessage = `定位錯誤 (${geoError.code}): ${geoError.message}`; break;
                }
            } else if (error instanceof Error) {
                 finalMessage = error.message;
            }
            
            // Sanitize common network errors
            const lowerCaseMessage = finalMessage.toLowerCase();
            if (lowerCaseMessage.includes('failed to fetch') || lowerCaseMessage.includes('networkerror')) {
                finalMessage = '網路連線失敗，請檢查您的網路連線。';
            }
            
            dailyInfoContainer.innerHTML = `
                <span class="text-red-500 flex items-center text-xs">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 002 0v-3a1 1 0 00-2 0z" clip-rule="evenodd" />
                    </svg>
                    ${finalMessage}
                </span>
            `;
        }
    };
    
    dateInput.addEventListener('change', () => {
        selectedDate = dateInput.value;
        fetchAndDisplayDailyInfo();
    });
    
    dateContainer.appendChild(dailyInfoContainer);
    container.appendChild(dateContainer);

    Object.entries(CATEGORY_CONFIG).forEach(([category, config]) => {
        const cat = category;
        const button = document.createElement('button');
        button.className = `w-full text-left p-4 rounded-lg flex items-center space-x-4 transition-transform transform active:scale-95`;
        button.style.backgroundColor = config.lightColor;
        button.style.border = `1px solid ${config.hexColor}40`; // Add a subtle border
        button.innerHTML = `
            <div style="color: ${config.hexColor};">${config.icon}</div>
            <div>
                <p class="font-bold text-lg text-gray-800">${category}</p>
                <p class="text-sm text-gray-600">記錄${category}相關的項目</p>
            </div>
        `;
        button.onclick = () => showEntryModal(cat);
        container.appendChild(button);
    });

    fetchAndDisplayDailyInfo(); // Initial fetch for today
    return container;
}


export function StatisticsView() {
    const container = document.createElement('div');
    container.className = 'p-4 space-y-4';
    
    let selectedCategories = ['行為'];
    let currentPeriod = 7;
    let currentChartType = 'combo';
    let aiAnalysisVisible = false;
    let aiAnalysisContent = null;
    let aiAnalysisLoading = false;
    let aiAnalysisError = null;

    const mainContentContainer = document.createElement('div');

    function showEditHistoryModal(entry) {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70] p-4 animate-fade-in-fast';
    
        const panel = document.createElement('div');
        panel.className = 'bg-white rounded-xl shadow-xl w-full max-w-sm animate-slide-up flex flex-col';
    
        const header = document.createElement('div');
        header.className = 'p-4 border-b flex items-center justify-between';
        const entryDate = new Date(entry.timestamp).toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' });
        header.innerHTML = `<h3 class="font-semibold text-center text-lg text-gray-800">編輯 ${entryDate} 的記錄</h3>`;
        const closeButton = document.createElement('button');
        closeButton.className = 'p-1 text-gray-500 hover:text-gray-800 rounded-full';
        closeButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>`;
        closeButton.onclick = () => overlay.remove();
        header.appendChild(closeButton);
    
        const body = document.createElement('div');
        body.className = 'p-4 space-y-4';
        body.innerHTML = `
            <div>
                <label for="edit-age" class="block text-sm font-medium text-gray-700">年齡</label>
                <div class="mt-1 relative rounded-md shadow-sm">
                    <input type="number" step="1" min="0" id="edit-age" value="${entry.age ?? ''}" class="block w-full rounded-md border-gray-300 pl-3 pr-12 focus:border-indigo-500 focus:ring-indigo-500 text-lg p-2">
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"><span class="text-gray-500">歲</span></div>
                </div>
            </div>
            <div>
                <label for="edit-height" class="block text-sm font-medium text-gray-700">身高</label>
                <div class="mt-1 relative rounded-md shadow-sm">
                    <input type="number" step="0.1" min="0" id="edit-height" value="${entry.height ?? ''}" class="block w-full rounded-md border-gray-300 pl-3 pr-16 focus:border-indigo-500 focus:ring-indigo-500 text-lg p-2">
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"><span class="text-gray-500">公分</span></div>
                </div>
            </div>
            <div>
                <label for="edit-weight" class="block text-sm font-medium text-gray-700">體重</label>
                <div class="mt-1 relative rounded-md shadow-sm">
                    <input type="number" step="0.1" min="0" id="edit-weight" value="${entry.weight ?? ''}" class="block w-full rounded-md border-gray-300 pl-3 pr-16 focus:border-indigo-500 focus:ring-indigo-500 text-lg p-2">
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"><span class="text-gray-500">公斤</span></div>
                </div>
            </div>
        `;
    
        const footer = document.createElement('div');
        footer.className = 'p-3 bg-gray-50 flex justify-end';
    
        const saveButton = document.createElement('button');
        saveButton.className = 'px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition';
        saveButton.textContent = '儲存變更';
        saveButton.onclick = () => {
            const ageInput = panel.querySelector('#edit-age');
            const heightInput = panel.querySelector('#edit-height');
            const weightInput = panel.querySelector('#edit-weight');
            
            const getVal = (input) => {
                if (!input || input.value.trim() === '') return undefined;
                const num = parseFloat(input.value);
                return isNaN(num) ? undefined : num;
            };
    
            const updates = {
                age: getVal(ageInput),
                height: getVal(heightInput),
                weight: getVal(weightInput),
            };
            updateBasicInfoHistoryEntry(entry.timestamp, updates);
            overlay.remove();
        };
    
        footer.appendChild(saveButton);
        panel.appendChild(header);
        panel.appendChild(body);
        panel.appendChild(footer);
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
        };
        overlay.appendChild(panel);
        document.body.appendChild(overlay);
    }
    
    function showDeleteHistoryConfirmation(entry) {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70] p-4 animate-fade-in-fast';

        const panel = document.createElement('div');
        panel.className = 'bg-white rounded-xl shadow-xl w-full max-w-xs animate-slide-up flex flex-col';

        const header = document.createElement('div');
        header.className = 'p-3 border-b';
        header.innerHTML = `<h3 class="font-semibold text-center text-red-600">確認刪除</h3>`;

        const body = document.createElement('div');
        body.className = 'p-4 text-center';
        const entryDate = new Date(entry.timestamp).toLocaleDateString('zh-TW');
        body.innerHTML = `您確定要刪除 ${entryDate} 的<br>這筆歷史記錄嗎？`;

        const footer = document.createElement('div');
        footer.className = 'p-2 bg-gray-50 grid grid-cols-2 gap-2';

        const cancelButton = document.createElement('button');
        cancelButton.className = 'px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition';
        cancelButton.textContent = '取消';
        cancelButton.onclick = () => overlay.remove();

        const confirmButton = document.createElement('button');
        confirmButton.className = 'px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition';
        confirmButton.textContent = '刪除';
        confirmButton.onclick = () => {
            deleteBasicInfoHistoryEntry(entry.timestamp);
            overlay.remove();
        };

        footer.appendChild(cancelButton);
        footer.appendChild(confirmButton);
        panel.appendChild(header);
        panel.appendChild(body);
        panel.appendChild(footer);
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
        };
        overlay.appendChild(panel);
        document.body.appendChild(overlay);
    }

    function showHistoryActionMenu(entry) {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-40 z-[60] animate-fade-in-fast';
    
        const panel = document.createElement('div');
        panel.className = 'fixed bottom-0 left-0 right-0 p-2 bg-transparent rounded-t-2xl animate-slide-up max-w-md mx-auto';
        
        const actionsGroup = document.createElement('div');
        actionsGroup.className = 'bg-white/80 backdrop-blur-xl rounded-xl overflow-hidden';
    
        const editButton = document.createElement('button');
        editButton.className = 'w-full p-3 text-center text-blue-500 font-semibold text-lg hover:bg-gray-100 transition';
        editButton.textContent = '編輯記錄';
        editButton.onclick = () => {
            overlay.remove();
            showEditHistoryModal(entry);
        };
    
        const deleteButton = document.createElement('button');
        deleteButton.className = 'w-full p-3 text-center text-red-500 font-semibold text-lg hover:bg-gray-100 transition';
        deleteButton.textContent = '刪除記錄';
        deleteButton.onclick = () => {
            overlay.remove();
            showDeleteHistoryConfirmation(entry);
        };
        
        const separator = document.createElement('div');
        separator.className = 'h-px bg-gray-300/60';
    
        actionsGroup.appendChild(editButton);
        actionsGroup.appendChild(separator);
        actionsGroup.appendChild(deleteButton);
    
        const cancelButton = document.createElement('button');
        cancelButton.className = 'w-full p-3 mt-2 text-center text-blue-500 font-bold text-lg bg-white/80 backdrop-blur-xl rounded-xl hover:bg-gray-100 transition';
        cancelButton.textContent = '取消';
        cancelButton.onclick = () => overlay.remove();
    
        panel.appendChild(actionsGroup);
        panel.appendChild(cancelButton);
        overlay.appendChild(panel);
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
        };
        document.body.appendChild(overlay);
    }

    const render = () => {
        container.innerHTML = '';
        mainContentContainer.innerHTML = '';

        // Sub-navigation
        const statsNav = document.createElement('div');
        statsNav.className = 'flex items-center bg-gray-200 rounded-lg p-1 mb-4';
        const views = [
            { id: 'charts', label: '圖表分析' },
            { id: 'basicInfo', label: '基本資料' }
        ];
        views.forEach(view => {
            const button = document.createElement('button');
            button.textContent = view.label;
            button.className = `flex-1 px-3 py-1.5 text-sm rounded-md transition font-semibold ${view.id === state.currentStatsView ? 'bg-white text-blue-600 shadow' : 'bg-transparent text-gray-600'}`;
            button.onclick = () => {
                setState({ currentStatsView: view.id });
            };
            statsNav.appendChild(button);
        });
        container.appendChild(statsNav);
        container.appendChild(mainContentContainer);

        if (state.currentStatsView === 'charts') {
            renderChartAnalysisView();
        } else {
            renderBasicInfoView();
        }
    };
    
    function renderBasicInfoView() {
        mainContentContainer.innerHTML = '';
        const section = document.createElement('div');
        section.className = 'bg-white p-4 rounded-lg shadow-sm animate-fade-in space-y-4';
        
        const { age, height, weight } = state.basicInfo;

        if (!age && !height && !weight) {
            section.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p class="mt-4 font-semibold text-gray-700">尚未設定基本資料</p>
                    <p class="text-sm text-gray-500 mt-1 mb-4">設定身高、體重與年齡有助於更全面的觀察。</p>
                    <button id="add-basic-info-btn" class="px-5 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition shadow-sm">
                        前往設定
                    </button>
                </div>
            `;
            section.querySelector('#add-basic-info-btn').onclick = () => showBasicInfoModal({ isAdding: true });
        } else {
            const header = document.createElement('div');
            header.className = 'flex justify-between items-center';
            header.innerHTML = `<h3 class="text-lg font-bold text-gray-800">基本資料</h3>`;
            const addButton = document.createElement('button');
            addButton.className = 'px-4 py-1.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition';
            addButton.textContent = '新增';
            addButton.onclick = () => showBasicInfoModal({ isAdding: true });
            header.appendChild(addButton);
            
            const grid = document.createElement('div');
            grid.className = 'grid grid-cols-3 gap-3 text-center';
            
            const createInfoBox = (label, value, unit) => `
                <div class="bg-gray-50 p-3 rounded-lg">
                    <p class="text-sm font-medium text-gray-500">${label}</p>
                    <p class="text-2xl font-bold text-gray-800">${value}</p>
                    <p class="text-xs text-gray-500">${unit}</p>
                </div>
            `;
            
            grid.innerHTML = `
                ${createInfoBox('年齡', age != null ? String(age) : '--', '歲')}
                ${createInfoBox('身高', height != null ? String(height) : '--', '公分')}
                ${createInfoBox('體重', weight != null ? String(weight) : '--', '公斤')}
            `;
            
            let bmiSection = null;
            if (height && weight) {
                const heightInMeters = height / 100;
                const bmi = weight / (heightInMeters * heightInMeters);
                const { category, color } = getBMICategory(bmi);
                bmiSection = document.createElement('div');
                bmiSection.className = 'text-center p-4 rounded-lg';
                bmiSection.style.backgroundColor = `${color}1A`;
                bmiSection.innerHTML = `
                    <p class="text-sm font-medium" style="color: ${color};">身體質量指數 (BMI)</p>
                    <p class="text-3xl font-bold" style="color: ${color};">${bmi.toFixed(1)}</p>
                    <p class="text-sm font-semibold" style="color: ${color};">${category}</p>
                `;
            }
            
            section.appendChild(header);
            section.appendChild(grid);
            if (bmiSection) section.appendChild(bmiSection);

            if (state.basicInfoHistory && state.basicInfoHistory.length > 0) {
                const historySection = document.createElement('div');
                historySection.className = 'mt-4 pt-4 border-t border-gray-200';
                historySection.innerHTML = `<h4 class="text-md font-semibold text-gray-700 mb-2">歷史記錄</h4>`;
                
                const historyList = document.createElement('ul');
                historyList.className = 'space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2';

                [...state.basicInfoHistory].reverse().forEach(entry => {
                    const li = document.createElement('li');
                    li.className = 'flex justify-between items-center p-2.5 bg-gray-50/70 rounded-lg text-sm noselect';

                    const date = new Date(entry.timestamp).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
                    
                    const dateSpan = document.createElement('span');
                    dateSpan.className = 'font-semibold text-gray-800 tracking-tight';
                    dateSpan.textContent = date;

                    const statsDiv = document.createElement('div');
                    statsDiv.className = 'flex items-baseline space-x-4 text-gray-600';
                    
                    let statsContent = '';
                    if (entry.age) statsContent += `<span>${entry.age} <span class="text-xs">歲</span></span>`;
                    if (entry.height) statsContent += `<span>${entry.height} <span class="text-xs">cm</span></span>`;
                    if (entry.weight) statsContent += `<span>${entry.weight} <span class="text-xs">kg</span></span>`;

                    statsDiv.innerHTML = statsContent;

                    li.appendChild(dateSpan);
                    li.appendChild(statsDiv);
                    
                    let pressTimer = null;
                    let longPressTriggered = false;
              
                    const startPress = (e) => {
                        longPressTriggered = false;
                        pressTimer = window.setTimeout(() => {
                            longPressTriggered = true;
                            if ('vibrate' in navigator) navigator.vibrate(50);
                            showHistoryActionMenu(entry);
                        }, 700);
                    };
              
                    const cancelPress = () => {
                        if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
                    };
                    
                    li.addEventListener('mousedown', startPress);
                    li.addEventListener('touchstart', startPress, { passive: true });
                    li.addEventListener('mouseup', cancelPress);
                    li.addEventListener('mouseleave', cancelPress);
                    li.addEventListener('touchend', cancelPress);
                    li.addEventListener('touchcancel', cancelPress);
                    li.addEventListener('touchmove', cancelPress, { passive: true });
                    
                    li.addEventListener('click', (e) => {
                      if (longPressTriggered) {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }, true);

                    historyList.appendChild(li);
                });
                
                historySection.appendChild(historyList);
                const hint = document.createElement('p');
                hint.className = 'text-center text-xs text-gray-400 mt-3';
                hint.textContent = '提示：長按歷史記錄可進行編輯或刪除。';
                historySection.appendChild(hint);
                section.appendChild(historySection);
            }
        }
        mainContentContainer.appendChild(section);

        if (state.basicInfoHistory && state.basicInfoHistory.length > 0) {
            const trendSection = document.createElement('div');
            trendSection.className = 'bg-white p-4 rounded-lg shadow-sm animate-fade-in space-y-2 mt-4';
            trendSection.innerHTML = `<h3 class="text-lg font-bold text-gray-800">成長趨勢</h3>`;
            const chartContainer = document.createElement('div');
            chartContainer.id = 'growth-chart-container';
            chartContainer.className = 'min-h-[350px]';
            trendSection.appendChild(chartContainer);
            
            mainContentContainer.appendChild(trendSection);

            setTimeout(() => {
                renderGrowthChart(chartContainer, state.basicInfoHistory);
            }, 0);
        }
    }
    
    function renderChartAnalysisView() {
        mainContentContainer.innerHTML = '';
        const controls = document.createElement('div');
        controls.className = 'bg-white p-3 rounded-lg shadow-sm space-y-3 animate-fade-in';

        const categorySelectorContainer = document.createElement('div');
        const categoryLabel = document.createElement('label');
        categoryLabel.className = 'text-sm font-medium text-gray-700';
        categorySelectorContainer.appendChild(categoryLabel);
        
        const categorySelector = document.createElement('div');
        categorySelector.className = 'grid grid-cols-3 gap-2 mt-1';
        Object.keys(CATEGORY_CONFIG).forEach(catStr => {
            const cat = catStr;
            const button = document.createElement('button');
            button.dataset.cat = cat;
            button.textContent = cat;
            button.className = `px-2 py-1.5 text-sm rounded-md transition`;
            button.onclick = () => {
                if (currentChartType === 'stacked') {
                    const index = selectedCategories.indexOf(cat);
                    if (index > -1) {
                        if (selectedCategories.length > 1) {
                            selectedCategories.splice(index, 1);
                        }
                    } else {
                        selectedCategories.push(cat);
                    }
                } else {
                    selectedCategories = [cat];
                    if (cat === '行為') currentChartType = 'combo';
                    else if (cat === '情緒') currentChartType = 'pie';
                    else currentChartType = 'stacked';
                }
                updateControlsUI();
                updateCharts();
            };
            categorySelector.appendChild(button);
        });
        categorySelectorContainer.appendChild(categorySelector);

        const periodSelectorContainer = document.createElement('div');
        const periodLabel = document.createElement('label');
        periodLabel.textContent = '時間範圍：';
        periodLabel.className = 'text-sm font-medium text-gray-700';
        periodSelectorContainer.appendChild(periodLabel);
        const periodSelector = document.createElement('div');
        periodSelector.className = 'flex items-center bg-gray-100 rounded-lg p-1 mt-1';
        [7, 30, 90].forEach(p => {
            const button = document.createElement('button');
            button.dataset.period = String(p);
            button.textContent = `最近 ${p} 天`;
            button.className = `flex-1 px-3 py-1.5 text-sm rounded-md transition font-semibold`;
            button.onclick = () => {
                currentPeriod = p;
                updateControlsUI();
                updateCharts();
            };
            periodSelector.appendChild(button);
        });
        periodSelectorContainer.appendChild(periodSelector);

        const chartTypeSelectorContainer = document.createElement('div');
        const chartTypeLabel = document.createElement('label');
        chartTypeLabel.textContent = '圖表類型：';
        chartTypeLabel.className = 'text-sm font-medium text-gray-700';
        chartTypeSelectorContainer.appendChild(chartTypeLabel);
        const chartTypeSelector = document.createElement('div');
        chartTypeSelector.className = 'flex items-center bg-gray-100 rounded-lg p-1 mt-1';
        chartTypeSelectorContainer.appendChild(chartTypeSelector);

        const aiButtonContainer = document.createElement('div');
        aiButtonContainer.className = 'pt-3 border-t border-gray-200/80';
        const aiButton = document.createElement('button');
        aiButton.id = 'ai-analysis-btn';
        aiButton.className = 'w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50';
        if (!ai) {
            aiButton.disabled = true;
            aiButton.innerHTML += ` (未配置)`;
        }
        aiButtonContainer.appendChild(aiButton);

        controls.appendChild(categorySelectorContainer);
        controls.appendChild(periodSelectorContainer);
        controls.appendChild(chartTypeSelectorContainer);
        controls.appendChild(aiButtonContainer);

        const chartContainer = document.createElement('div');
        chartContainer.id = 'chart-container';
        chartContainer.className = 'bg-white p-2 rounded-lg shadow-sm min-h-[350px] mt-4';
        
        const aiContainer = document.createElement('div');
        aiContainer.id = 'ai-container';
        aiContainer.className = 'relative bg-white p-4 rounded-lg shadow-sm mt-4 text-gray-800 text-sm leading-relaxed border-l-4 border-blue-400 animate-fade-in';
        aiContainer.style.display = 'none';

        mainContentContainer.appendChild(controls);
        mainContentContainer.appendChild(chartContainer);
        mainContentContainer.appendChild(aiContainer);

        const renderAIAnalysis = () => {
            const openIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>`;
            if (!aiAnalysisVisible) {
                aiContainer.style.display = 'none';
                aiButton.innerHTML = `${openIcon}<span>開啟 AI 智能分析</span>`;
                return;
            }
            aiContainer.style.display = 'block';
            aiButton.innerHTML = `${openIcon}<span>關閉 AI 智能分析</span>`;
            aiContainer.innerHTML = '';
            if (aiAnalysisLoading) {
                aiContainer.innerHTML = `<div class="flex items-center justify-center flex-col p-8"><svg class="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><p class="mt-4 text-base font-semibold text-gray-600">AI 正在為您分析日誌，請稍候...</p></div>`;
            } else if (aiAnalysisError) {
                aiContainer.innerHTML = `<div class="text-red-600 p-4 bg-red-50 rounded-lg"><p><strong>分析失敗：</strong> ${aiAnalysisError}</p></div>`;
            } else if (aiAnalysisContent) {
                const formattedContent = aiAnalysisContent.replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900 font-semibold">$1</strong>').replace(/(\n|^)(\d\.\s.*)/g, '$1<p class="mt-2 mb-1">$2</p>').replace(/\n/g, '<br>');
                aiContainer.innerHTML = `<div>${formattedContent}</div>`;
            }
        };
        
        aiButton.onclick = async () => {
            if (aiAnalysisVisible) {
                aiAnalysisVisible = false;
                renderAIAnalysis();
                return;
            }
            aiAnalysisVisible = true; aiAnalysisLoading = true; aiAnalysisError = null; aiAnalysisContent = null;
            renderAIAnalysis();
            try {
                const endDate = new Date();
                const startDate = new Date();
                startDate.setDate(endDate.getDate() - currentPeriod);
                startDate.setHours(0, 0, 0, 0);
                const entriesForAI = state.entries.filter(entry => new Date(entry.timestamp) >= startDate && new Date(entry.timestamp) <= endDate);
                if (entriesForAI.length < 5) throw new Error('此期間沒有足夠的資料可供 AI 分析 (至少需要 5 筆記錄)。');
                const result = await analyzeLogsWithGemini(entriesForAI, currentPeriod, selectedCategories[0]);
                aiAnalysisContent = result;
            } catch (e) {
                aiAnalysisError = e.message || '發生未知錯誤';
            } finally {
                aiAnalysisLoading = false;
                renderAIAnalysis();
            }
        };

        const updateControlsUI = () => {
            const isMultiSelect = currentChartType === 'stacked';
            categoryLabel.textContent = isMultiSelect ? '分析類別 (可複選)：' : '分析類別：';
            categorySelector.querySelectorAll('button').forEach(btn => {
                const cat = btn.dataset.cat;
                const isSelected = selectedCategories.includes(cat);
                btn.className = `px-2 py-1.5 text-sm rounded-md transition ${isSelected ? 'bg-blue-500 text-white font-semibold' : 'bg-gray-200 text-gray-700'}`;
            });
            periodSelector.querySelectorAll('button').forEach(btn => {
                const periodValue = parseInt(btn.dataset.period || '0', 10);
                btn.className = `flex-1 px-3 py-1.5 text-sm rounded-md transition font-semibold ${periodValue === currentPeriod ? 'bg-white text-blue-600 shadow' : 'bg-transparent text-gray-600'}`;
            });
            chartTypeSelector.innerHTML = '';
            const chartTypes = [{ id: 'stacked', label: '趨勢圖' }, { id: 'pie', label: '分佈圖' }, { id: 'combo', label: '氣溫' }, { id: 'bar', label: '總計圖' }];
            chartTypes.forEach(type => {
                if (!isMultiSelect && selectedCategories[0] === '情緒' && type.id === 'combo') return;
                const button = document.createElement('button');
                button.dataset.type = type.id;
                button.textContent = type.label;
                button.className = `chart-type-btn flex-1 px-3 py-1.5 text-sm rounded-md transition font-semibold ${type.id === currentChartType ? 'bg-white text-blue-600 shadow' : 'bg-transparent text-gray-600'}`;
                button.onclick = () => {
                    const oldType = currentChartType;
                    currentChartType = type.id;
                    if (oldType === 'stacked' && currentChartType !== 'stacked' && selectedCategories.length > 1) {
                        selectedCategories = [selectedCategories[0]];
                    }
                    updateControlsUI();
                    updateCharts();
                };
                chartTypeSelector.appendChild(button);
            });
        };

        const updateCharts = () => {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - currentPeriod + 1);
            startDate.setHours(0, 0, 0, 0);
            if (currentChartType === 'stacked') {
                if (selectedCategories.length > 1) {
                    const filteredEntries = state.entries.filter(entry => new Date(entry.timestamp) >= startDate && new Date(entry.timestamp) <= endDate && selectedCategories.includes(entry.category));
                    const dataByDate = {};
                    filteredEntries.forEach(entry => {
                        const date = new Date(entry.timestamp).toISOString().split('T')[0];
                        if (!dataByDate[date]) dataByDate[date] = {};
                        const itemCount = entry.content.replace(/^[^:]+:\s*/, '').split(', ').filter(item => item.trim()).length;
                        dataByDate[date][entry.category] = (dataByDate[date][entry.category] || 0) + itemCount;
                    });
                    const chartData = [];
                    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                        const dateStr = d.toISOString().split('T')[0];
                        const dayData = dataByDate[dateStr] || {};
                        const entryForChart = { date: dateStr };
                        let total = 0;
                        selectedCategories.forEach(cat => { const count = dayData[cat] || 0; entryForChart[cat] = count; total += count; });
                        entryForChart.total = total;
                        chartData.push(entryForChart);
                    }
                    renderStackedBarChart(chartContainer, chartData, selectedCategories, selectedCategories[0]);
                } else {
                    const currentCategory = selectedCategories[0];
                    const filteredEntries = state.entries.filter(entry => new Date(entry.timestamp) >= startDate && new Date(entry.timestamp) <= endDate && entry.category === currentCategory);
                    const dataByDate = {};
                    const allKeys = new Set();
                    filteredEntries.forEach(entry => {
                        const date = new Date(entry.timestamp).toISOString().split('T')[0];
                        if (!dataByDate[date]) dataByDate[date] = { total: 0 };
                        entry.content.replace(/^[^:]+:\s*/, '').split(', ').forEach(item => { const cleanItem = item.trim(); if (cleanItem) { allKeys.add(cleanItem); dataByDate[date][cleanItem] = (dataByDate[date][cleanItem] || 0) + 1; } });
                    });
                    const chartData = [];
                    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                        const dateStr = d.toISOString().split('T')[0];
                        const dayData = dataByDate[dateStr] || { total: 0 };
                        let total = 0;
                        const entryForChart = { date: dateStr };
                        allKeys.forEach(key => { const count = dayData[key] || 0; entryForChart[key] = count; total += count; });
                        entryForChart.total = total;
                        chartData.push(entryForChart);
                    }
                    renderStackedBarChart(chartContainer, chartData, Array.from(allKeys).sort(), currentCategory);
                }
            } else {
                const currentCategory = selectedCategories[0];
                const filteredEntries = state.entries.filter(entry => new Date(entry.timestamp) >= startDate && new Date(entry.timestamp) <= endDate && entry.category === currentCategory);
                if (currentChartType === 'combo') {
                    const dataByDate = {};
                    filteredEntries.forEach(entry => {
                        const date = new Date(entry.timestamp).toISOString().split('T')[0];
                        if (!dataByDate[date]) dataByDate[date] = { count: 0 };
                        dataByDate[date].count += entry.content.replace(/^[^:]+:\s*/, '').split(', ').filter(item => item.trim()).length;
                    });
                    const chartData = [];
                    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                        const dateStr = d.toISOString().split('T')[0];
                        const dailyInfo = state.dailyInfo[dateStr];
                        chartData.push({ date: dateStr, count: (dataByDate[dateStr] || { count: 0 }).count, temp: dailyInfo ? dailyInfo.weather.temp : null });
                    }
                    renderComboChart(chartContainer, chartData, currentCategory);
                } else if (currentChartType === 'pie') {
                    const counts = {};
                    filteredEntries.forEach(entry => entry.content.replace(/^[^:]+:\s*/, '').split(', ').forEach(item => { const cleanItem = item.trim(); if (cleanItem) counts[cleanItem] = (counts[cleanItem] || 0) + 1; }));
                    renderPieChart(chartContainer, Object.entries(counts).map(([name, value]) => ({ name, value })), currentCategory);
                } else {
                    const dataByDate = {};
                    filteredEntries.forEach(entry => {
                        const date = new Date(entry.timestamp).toISOString().split('T')[0];
                        dataByDate[date] = (dataByDate[date] || 0) + entry.content.replace(/^[^:]+:\s*/, '').split(', ').filter(item => item.trim()).length;
                    });
                    const chartData = [];
                    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                        const dateStr = d.toISOString().split('T')[0];
                        chartData.push({ date: dateStr, value: dataByDate[dateStr] || 0 });
                    }
                    renderBarChart(chartContainer, chartData, currentCategory);
                }
            }
        };

        setTimeout(() => { updateControlsUI(); updateCharts(); }, 50);
    }
    
    render();
    return container;
}
