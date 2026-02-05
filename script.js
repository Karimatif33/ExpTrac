const defaultItems = [
    { name: "زبادي", price: 12, category: "غذاء" },
    { name: "جبنه لايت", price: 28, category: "غذاء" },
    { name: "جبنه قريش", price: 28, category: "غذاء" },
    { name: "مخلل", price: 30, category: "غذاء" },
    { name: "زيتون", price: 50, category: "غذاء" },
    { name: "فلفل الوان", price: 12, category: "غذاء" },
    { name: "رايس كيك", price: 30, category: "أخرى" },
    { name: "شيكولاته", price: 15, category: "غذاء" },
    { name: "توابل", price: 13, category: "غذاء" },
    { name: "عيش", price: 12, category: "غذاء" },
    { name: "صلصه", price: 24, category: "غذاء" },
    { name: "مكرونه", price: 31, category: "غذاء" },
    { name: "تمر", price: 100, category: "غذاء" },
    { name: "جبنه نستو", price: 60, category: "غذاء" },
    { name: "مناديل", price: 100, category: "أخرى" },
    { name: "نسكافيه", price: 230, category: "شراب" },
    { name: "سويتال", price: 120, category: "شراب" }
];

let items = [];
let searchTerm = '';
let monthlyBudget = 0;
let filteredHistory = null;
let currentDate = new Date().toISOString().split('T')[0];

// Initialize
function initializeItems() {
    const saved = localStorage.getItem('expenseItems');
    const savedBudget = localStorage.getItem('monthlyBudget');

    if (saved) {
        try {
            items = JSON.parse(saved).map(item => ({
                id: item.id || Date.now(),
                name: item.name || '',
                price: item.price || 0,
                category: item.category || 'أخرى',
                quantity: item.quantity || 0
            }));
        } catch (e) {
            resetToDefault();
        }
    } else {
        resetToDefault();
    }

    if (savedBudget) {
        monthlyBudget = parseFloat(savedBudget);
    }

    // Set current date
    document.getElementById('expenseDate').value = currentDate;
    loadDateExpenses();
}

function resetToDefault() {
    items = defaultItems.map((item, index) => ({
        id: Date.now() + index,
        ...item,
        quantity: 0
    }));
    saveItems();
}

function saveItems() {
    try {
        localStorage.setItem('expenseItems', JSON.stringify(items));
    } catch (e) {
        alert('❌ خطأ في حفظ البيانات');
    }
}

// Render Items
function renderItems() {
    const grid = document.getElementById('itemsGrid');
    let filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredItems.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="icon">🔍</div>
                <h3>لا توجد نتائج</h3>
                <p>جرب البحث بكلمة أخرى</p>
            </div>
        `;
        updateStats();
        updateCaptureArea();
        return;
    }

    grid.innerHTML = filteredItems.map(item => {
        const subtotal = item.price * item.quantity;
        return `
            <div class="item-card ${item.quantity > 0 ? 'has-quantity' : ''}">
                <div class="item-header">
                    <div>
                        <div class="item-name">${item.name}</div>
                        <div style="font-size: 0.8em; color: var(--text-muted);">${item.category}</div>
                    </div>
                    <div class="item-price">${item.price} ج</div>
                </div>
                <div class="quantity-control">
                    <button class="qty-btn" onclick="changeQuantity(${item.id}, -1)">−</button>
                    <input type="number" class="qty-input" value="${item.quantity}"
                           onchange="setQuantity(${item.id}, this.value)" min="0" max="999">
                    <button class="qty-btn" onclick="changeQuantity(${item.id}, 1)">+</button>
                </div>
                <div class="item-subtotal">${subtotal.toFixed(2)} ج</div>
                <button class="delete-btn" onclick="deleteItem(${item.id})">🗑️ حذف</button>
            </div>
        `;
    }).join('');

    updateStats();
    updateCaptureArea();
}

// Quantity Management
function changeQuantity(id, delta) {
    const item = items.find(i => i.id === id);
    if (item) {
        item.quantity = Math.max(0, item.quantity + delta);
        saveItems();
        renderItems();
    }
}

function setQuantity(id, value) {
    const item = items.find(i => i.id === id);
    if (item) {
        const newQty = Math.max(0, Math.min(999, parseInt(value) || 0));
        item.quantity = newQty;
        saveItems();
        renderItems();
    }
}

function deleteItem(id) {
    if (confirm("هل تريد حذف هذا الصنف؟")) {
        items = items.filter(i => i.id !== id);
        saveItems();
        renderItems();
    }
}

// Stats & UI Updates
function updateStats() {
    const todayTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('todayTotal').textContent = todayTotal.toFixed(2) + ' جنيه';
    document.getElementById('dailyTotalBanner').textContent = todayTotal.toFixed(2);
    document.getElementById('itemsCount').textContent = items.filter(i => i.quantity > 0).length;

    const history = JSON.parse(localStorage.getItem('expensesHistory') || '[]');
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthTotal = history
        .filter(h => h.date && h.date.startsWith(currentMonth))
        .reduce((sum, h) => sum + (h.total || 0), 0);
    document.getElementById('monthTotal').textContent = monthTotal.toFixed(2) + ' جنيه';

    const avgDaily = history.length > 0
        ? history.reduce((sum, h) => sum + (h.total || 0), 0) / history.length
        : 0;
    document.getElementById('avgDaily').textContent = avgDaily.toFixed(2) + ' جنيه';

    // Budget remaining
    if (monthlyBudget > 0) {
        const remaining = monthlyBudget - monthTotal;
        const statusClass = remaining < 0 ? 'danger' : remaining < monthlyBudget * 0.2 ? 'warning' : 'success';
        document.getElementById('budgetRemaining').innerHTML =
            `<span style="color: var(--${statusClass})">${remaining.toFixed(2)} ج</span>`;
    }
}

function updateCaptureArea() {
    const selected = items.filter(item => item.quantity > 0);
    const captureItems = document.getElementById('captureItems');
    const captureTotal = document.getElementById('captureTotal');

    if (selected.length === 0) {
        captureItems.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:var(--text-muted); padding:2rem;">لا توجد أصناف مختارة</div>';
        captureTotal.innerHTML = '<span>0 جنيه</span>';
        return;
    }

    captureItems.innerHTML = selected.map(item => {
        const subtotal = item.price * item.quantity;
        return `
            <div class="capture-item">
                <div class="capture-item-name">${item.name}</div>
                <div class="capture-item-details">
                    <span>${item.quantity} × ${item.price}</span>
                    <strong>${subtotal.toFixed(2)} ج</strong>
                </div>
            </div>
        `;
    }).join('');

    const total = selected.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    captureTotal.innerHTML = `<span>${total.toFixed(2)} جنيه</span>`;
}

// Image Capture
function captureAsImage() {
    const selected = items.filter(item => item.quantity > 0);
    if (selected.length === 0) {
        alert("⚠️ اختر أصناف أولاً!");
        return;
    }

    const element = document.getElementById('captureArea');
    html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
    }).then(canvas => {
        const link = document.createElement('a');
        const dateStr = new Date().toISOString().slice(0, 10);
        link.download = `فاتورة_${dateStr}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        alert("✅ تم حفظ الفاتورة!");
    }).catch(() => alert("❌ خطأ في حفظ الصورة"));
}

// Save & Export
function saveTodayExpenses() {
    const today = new Date().toISOString().split('T')[0];
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (total === 0) {
        alert("⚠️ لا توجد مصروفات!");
        return;
    }

    let history = JSON.parse(localStorage.getItem('expensesHistory') || '[]');
    if (!Array.isArray(history)) history = [];

    const existing = history.findIndex(h => h.date === today);
    const entry = {
        date: today,
        total: parseFloat(total.toFixed(2)),
        items: items.filter(i => i.quantity > 0).map(i => ({
            name: i.name,
            quantity: i.quantity,
            price: i.price,
            category: i.category
        }))
    };

    if (existing >= 0) {
        if (confirm("توجد مصروفات لهذا اليوم. استبدالها؟")) {
            history[existing] = entry;
        } else return;
    } else {
        history.push(entry);
    }

    localStorage.setItem('expensesHistory', JSON.stringify(history));
    alert("✅ تم الحفظ!");
    loadHistory();
    loadAnalytics();
    resetQuantities();
}

function exportToCSV() {
    const history = JSON.parse(localStorage.getItem('expensesHistory') || '[]');
    if (history.length === 0) {
        alert("⚠️ لا توجد بيانات للتصدير!");
        return;
    }

    let csv = 'التاريخ,الصنف,الكمية,السعر,الإجمالي\n';
    history.forEach(entry => {
        if (entry.items) {
            entry.items.forEach(item => {
                csv += `${entry.date},${item.name},${item.quantity},${item.price},${(item.quantity * item.price).toFixed(2)}\n`;
            });
        }
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `مصروفات_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
}

// History & Analytics
function loadHistory() {
    const historyList = document.getElementById('historyList');
    let history = JSON.parse(localStorage.getItem('expensesHistory') || '[]');

    if (!Array.isArray(history)) history = [];
    history = filteredHistory || history;

    if (history.length === 0) {
        historyList.innerHTML = `<div class="empty-state"><div class="icon">📋</div><h3>لا يوجد سجل</h3></div>`;
        updateStats();
        return;
    }

    history.sort((a, b) => new Date(b.date) - new Date(a.date));

    historyList.innerHTML = history.map((entry, index) => {
        const dateObj = new Date(entry.date + 'T00:00:00');
        const dateStr = dateObj.toLocaleDateString('ar-EG', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

        return `
            <div class="history-item" onclick="toggleHistoryDetails(${index})">
                <div class="history-date">${dateStr}</div>
                <div class="history-total">💰 ${(entry.total || 0).toFixed(2)} جنيه</div>
                ${entry.items && entry.items.length > 0 ? `
                    <div class="history-details">
                        ${entry.items.map(item => `
                            <div class="history-detail-item">
                                <span>${item.name} × ${item.quantity}</span>
                                <span>${((item.price || 0) * item.quantity).toFixed(2)} جنيه</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');

    updateStats();
}

function loadAnalytics() {
    const history = JSON.parse(localStorage.getItem('expensesHistory') || '[]');
    if (!Array.isArray(history)) return;

    const total = history.reduce((sum, h) => sum + (h.total || 0), 0);
    const average = history.length > 0 ? total / history.length : 0;
    const max = Math.max(...history.map(h => h.total || 0), 0);

    const categoryCounts = {};
    history.forEach(entry => {
        if (entry.items) {
            entry.items.forEach(item => {
                const cat = item.category || 'أخرى';
                categoryCounts[cat] = (categoryCounts[cat] || 0) + (item.price * item.quantity);
            });
        }
    });

    const grid = document.getElementById('analyticsGrid');
    grid.innerHTML = `
        <div class="analytics-card">
            <h3>إجمالي المصروفات</h3>
            <div class="analytics-value">${total.toFixed(2)}</div>
            <div class="analytics-label">جنيه</div>
        </div>
        <div class="analytics-card">
            <h3>المتوسط اليومي</h3>
            <div class="analytics-value">${average.toFixed(2)}</div>
            <div class="analytics-label">جنيه</div>
        </div>
        <div class="analytics-card">
            <h3>أعلى يوم</h3>
            <div class="analytics-value">${max.toFixed(2)}</div>
            <div class="analytics-label">جنيه</div>
        </div>
        <div class="analytics-card">
            <h3>عدد الأيام</h3>
            <div class="analytics-value">${history.length}</div>
            <div class="analytics-label">يوم</div>
        </div>
        ${Object.entries(categoryCounts).map(([cat, amount]) => `
            <div class="analytics-card">
                <h3>${cat}</h3>
                <div class="analytics-value">${amount.toFixed(2)}</div>
                <div class="analytics-label">جنيه</div>
            </div>
        `).join('')}
    `;
}

function toggleHistoryDetails(index) {
    const items = document.querySelectorAll('.history-item');
    if (items[index]) items[index].classList.toggle('expanded');
}

function resetQuantities() {
    if (confirm("تصفير جميع الكميات؟")) {
        items.forEach(item => item.quantity = 0);
        saveItems();
        renderItems();
    }
}

function clearAllData() {
    if (confirm("⚠️ حذف جميع البيانات؟")) {
        if (confirm("تأكيد: سيتم حذف كل شيء!")) {
            localStorage.clear();
            location.reload();
        }
    }
}

// Budget Management
function setBudget() {
    const amount = parseFloat(document.getElementById('budgetAmount').value);
    if (isNaN(amount) || amount <= 0) {
        alert("⚠️ أدخل ميزانية صحيحة!");
        return;
    }

    monthlyBudget = amount;
    localStorage.setItem('monthlyBudget', amount.toString());
    updateBudgetDisplay();
    updateStats();
    alert("✅ تم تعيين الميزانية!");
}

function updateBudgetDisplay() {
    const display = document.getElementById('budgetDisplay');
    if (monthlyBudget === 0) {
        display.innerHTML = '<p>لم يتم تعيين ميزانية شهرية بعد</p>';
        return;
    }

    const history = JSON.parse(localStorage.getItem('expensesHistory') || '[]');
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthTotal = history
        .filter(h => h.date && h.date.startsWith(currentMonth))
        .reduce((sum, h) => sum + (h.total || 0), 0);

    const remaining = monthlyBudget - monthTotal;
    const percentage = Math.min((monthTotal / monthlyBudget) * 100, 100);

    display.innerHTML = `
        <div style="text-align: center; margin-bottom: 1rem;">
            <h3>الميزانية الشهرية: ${monthlyBudget.toFixed(2)} جنيه</h3>
            <p>المنفق: ${monthTotal.toFixed(2)} جنيه</p>
            <p>المتبقي: <span style="color: ${remaining < 0 ? 'var(--danger)' : 'var(--success)'}">${remaining.toFixed(2)} جنيه</span></p>
        </div>
        <div class="budget-bar">
            <div class="budget-fill" style="width: ${percentage}%"></div>
        </div>
        <p style="text-align: center; margin-top: 1rem; color: var(--text-muted);">
            ${percentage.toFixed(1)}% من الميزانية
        </p>
    `;
}

// Navigation
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    // Show selected tab
    document.getElementById(tabName + '-tab').classList.add('active');
    document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');

    // Load tab-specific data
    if (tabName === 'analytics') {
        loadAnalytics();
    } else if (tabName === 'budget') {
        updateBudgetDisplay();
    } else if (tabName === 'history') {
        loadHistory();
    } else if (tabName === 'weekly') {
        currentWeekStart = getWeekStart(new Date());
        loadWeeklyPlan();
    } else if (tabName === 'monthly') {
        currentMonthDate = new Date();
        loadMonthlyPlan();
    }
}

function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');

    // Prevent body scroll when sidebar is open
    if (sidebar.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'auto';
    }
}

// Close sidebar when clicking outside
document.addEventListener('click', function (e) {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');

    if (sidebar && menuToggle) {
        if (!sidebar.contains(e.target) && !menuToggle.contains(e.target) && sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }
});

// Close sidebar on escape key
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
        closeModal();
    }
});

// Dark Mode
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// Modal Management
function openAddItemModal() {
    document.getElementById('addItemModal').classList.add('active');
}

function closeModal() {
    document.getElementById('addItemModal').classList.remove('active');
    document.getElementById('newItemName').value = '';
    document.getElementById('newItemPrice').value = '';
}

function addNewItem() {
    const name = document.getElementById('newItemName').value.trim();
    const price = parseFloat(document.getElementById('newItemPrice').value);
    const category = document.getElementById('newItemCategory').value;

    if (!name || isNaN(price) || price < 0) {
        alert("⚠️ ادخل بيانات صحيحة!");
        return;
    }

    items.push({
        id: Date.now(),
        name: name,
        price: parseFloat(price.toFixed(2)),
        category: category,
        quantity: 0
    });

    saveItems();
    renderItems();
    closeModal();
}

// Search & Filter
function handleSearch() {
    searchTerm = document.getElementById('searchBox').value.trim();
    renderItems();
}

function applySorting() {
    const sortType = document.getElementById('sortFilter').value;
    switch (sortType) {
        case 'name':
            items.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
            break;
        case 'price-low':
            items.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            items.sort((a, b) => b.price - a.price);
            break;
        case 'quantity':
            items.sort((a, b) => b.quantity - a.quantity);
            break;
    }
    saveItems();
    renderItems();
}

// History Filtering
function filterHistory() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    if (!startDate && !endDate) {
        filteredHistory = null;
        loadHistory();
        return;
    }

    const history = JSON.parse(localStorage.getItem('expensesHistory') || '[]');
    filteredHistory = history.filter(entry => {
        const entryDate = entry.date;
        if (startDate && entryDate < startDate) return false;
        if (endDate && entryDate > endDate) return false;
        return true;
    });

    loadHistory();
}

function resetDateFilter() {
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    filteredHistory = null;
    loadHistory();
}

// Chart
function toggleChartView() {
    const chartContainer = document.getElementById('chartContainer');
    chartContainer.classList.toggle('active');

    if (chartContainer.classList.contains('active') && chartContainer.innerHTML === '') {
        renderChart();
    }
}

function renderChart() {
    const history = JSON.parse(localStorage.getItem('expensesHistory') || '[]');
    if (!Array.isArray(history) || history.length === 0) return;

    const sortedHistory = [...history]
        .filter(h => h.date && h.total)
        .sort((a, b) => a.date.localeCompare(b.date));

    if (sortedHistory.length === 0) return;

    const chartContainer = document.getElementById('chartContainer');
    chartContainer.innerHTML = '<h3 style="text-align:center; margin-bottom:15px; color: var(--text);">📊 الرسم البياني</h3>';

    const maxTotal = Math.max(...sortedHistory.map(h => h.total));
    sortedHistory.forEach(entry => {
        const percentage = (entry.total / maxTotal) * 100;
        const dateObj = new Date(entry.date + 'T00:00:00');
        const dateStr = dateObj.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });

        chartContainer.innerHTML += `
            <div class="chart-bar">
                <div class="chart-label">${dateStr}</div>
                <div class="chart-bar-fill" style="width: ${Math.max(percentage, 5)}%;">
                    ${entry.total.toFixed(0)} ج
                </div>
            </div>
        `;
    });
}

// Date & Initialization
function updateCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent =
        new Date().toLocaleDateString('ar-EG', options);
}

// Initialize on load
window.addEventListener('load', function () {
    updateCurrentDate();
    initializeItems();
    renderItems();
    loadHistory();
    updateCaptureArea();
    updateBudgetDisplay();

    // Load dark mode preference
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        closeModal();
    }
});

// Weekly & Monthly Planning
let currentWeekStart = new Date();
let currentMonthDate = new Date();

function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

function getWeekDates(startDate) {
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        dates.push(date);
    }
    return dates;
}

function prevWeek() {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    currentWeekStart = getWeekStart(newDate);
    loadWeeklyPlan();
}

function nextWeek() {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    currentWeekStart = getWeekStart(newDate);
    loadWeeklyPlan();
}

function prevMonth() {
    currentMonthDate.setMonth(currentMonthDate.getMonth() - 1);
    loadMonthlyPlan();
}

function nextMonth() {
    currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
    loadMonthlyPlan();
}

function loadWeeklyPlan() {
    const weekDates = getWeekDates(currentWeekStart);
    const history = JSON.parse(localStorage.getItem('expensesHistory') || '[]');

    // Update header
    const startStr = weekDates[0].toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
    const endStr = weekDates[6].toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' });
    document.getElementById('currentWeekDisplay').textContent = `${startStr} - ${endStr}`;

    // Calculate weekly data
    const weeklyData = {};
    let weekTotal = 0;
    let maxDay = { date: null, total: 0 };
    let daysWithExpense = 0;

    weekDates.forEach((date, index) => {
        const dateStr = date.toISOString().split('T')[0];
        const dayExpense = history.find(h => h.date === dateStr);
        const dayTotal = dayExpense ? dayExpense.total : 0;

        weeklyData[dateStr] = {
            date: date,
            total: dayTotal,
            items: dayExpense ? dayExpense.items : [],
            dayName: date.toLocaleDateString('ar-EG', { weekday: 'short' })
        };

        weekTotal += dayTotal;
        if (dayTotal > maxDay.total) {
            maxDay = { date: dateStr, total: dayTotal };
        }
        if (dayTotal > 0) daysWithExpense++;
    });

    // Render day cards
    const grid = document.getElementById('weeklyGrid');
    grid.innerHTML = Object.entries(weeklyData).map(([dateStr, data]) => `
        <div class="day-card ${data.total > 0 ? 'has-expense' : ''}">
            <div class="day-name">${data.dayName}</div>
            <div class="day-date">${new Date(dateStr).toLocaleDateString('ar-EG', { day: 'numeric', month: 'numeric' })}</div>
            <div class="day-total">${data.total.toFixed(2)} ج</div>
            <div class="day-items">
                ${data.items.length > 0 ? data.items.map(item => `
                    <div class="day-item">
                        <span>${item.name}</span>
                        <span>${(item.quantity * item.price).toFixed(2)}</span>
                    </div>
                `).join('') : '<div style="color: var(--text-muted); text-align: center; padding: 1rem;">لا توجد مصروفات</div>'}
            </div>
        </div>
    `).join('');

    // Render summary
    const summary = document.getElementById('weeklySummary');
    const avgDay = daysWithExpense > 0 ? weekTotal / daysWithExpense : 0;
    summary.innerHTML = `
        <h3>📊 ملخص الأسبوع</h3>
        <div class="summary-grid">
            <div class="summary-item">
                <div class="summary-label">إجمالي الأسبوع</div>
                <div class="summary-value">${weekTotal.toFixed(2)}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">متوسط اليوم</div>
                <div class="summary-value">${(weekTotal / 7).toFixed(2)}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">أعلى يوم</div>
                <div class="summary-value">${maxDay.total.toFixed(2)}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">أيام بمصروفات</div>
                <div class="summary-value">${daysWithExpense}</div>
            </div>
        </div>
    `;
}

function loadMonthlyPlan() {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const history = JSON.parse(localStorage.getItem('expensesHistory') || '[]');

    // Update header
    const monthStr = currentMonthDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
    document.getElementById('currentMonthDisplay').textContent = monthStr;

    // Generate calendar
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);
    const nextDays = 7 - lastDay.getDay();

    let monthTotal = 0;
    let daysWithExpense = 0;
    const monthlyExpenses = {};
    const weeklyData = {};

    // Calculate data
    history.forEach(entry => {
        const entryDate = new Date(entry.date);
        if (entryDate.getMonth() === month && entryDate.getFullYear() === year) {
            monthTotal += entry.total;
            daysWithExpense++;
            monthlyExpenses[entry.date] = entry.total;

            // Calculate week data
            const weekStart = getWeekStart(entryDate).toISOString().split('T')[0];
            if (!weeklyData[weekStart]) {
                weeklyData[weekStart] = 0;
            }
            weeklyData[weekStart] += entry.total;
        }
    });

    // Render calendar
    const calendar = document.getElementById('monthCalendar');
    let calendarHTML = `
        <div class="calendar-header">
            ${['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map(day => `
                <div class="calendar-day-header">${day}</div>
            `).join('')}
        </div>
        <div class="calendar-grid">
    `;

    // Previous month days
    for (let i = prevLastDay.getDate() - firstDay.getDay() + 1; i <= prevLastDay.getDate(); i++) {
        calendarHTML += `
            <div class="calendar-date other-month">
                <div class="date-number">${i}</div>
            </div>
        `;
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const isToday = new Date().toISOString().split('T')[0] === dateStr;
        const hasExpense = monthlyExpenses[dateStr];
        const amount = monthlyExpenses[dateStr] || 0;

        calendarHTML += `
            <div class="calendar-date ${isToday ? 'today' : ''} ${hasExpense ? 'has-expense' : ''}">
                <div class="date-number">${i}</div>
                ${amount > 0 ? `<div class="date-amount">${amount.toFixed(0)} ج</div>` : ''}
                ${hasExpense ? `<div class="date-items-count">✓</div>` : ''}
            </div>
        `;
    }

    // Next month days
    for (let i = 1; i <= nextDays; i++) {
        calendarHTML += `
            <div class="calendar-date other-month">
                <div class="date-number">${i}</div>
            </div>
        `;
    }

    calendarHTML += '</div>';
    calendar.innerHTML = calendarHTML;

    // Render summary
    const avgDay = daysWithExpense > 0 ? monthTotal / daysWithExpense : 0;
    const monthDays = lastDay.getDate();
    const avgPerDay = monthTotal / monthDays;

    let summaryHTML = `
        <div class="summary-grid-2">
            <div class="summary-card">
                <h3>إجمالي الشهر</h3>
                <div class="value">${monthTotal.toFixed(2)}</div>
                <div class="label">جنيه</div>
            </div>
            <div class="summary-card">
                <h3>متوسط اليوم</h3>
                <div class="value">${avgPerDay.toFixed(2)}</div>
                <div class="label">جنيه</div>
            </div>
            <div class="summary-card">
                <h3>أيام بمصروفات</h3>
                <div class="value">${daysWithExpense}</div>
                <div class="label">من ${monthDays}</div>
            </div>
            <div class="summary-card">
                <h3>متوسط يوم الإنفاق</h3>
                <div class="value">${avgDay.toFixed(2)}</div>
                <div class="label">جنيه</div>
            </div>
        </div>
    `;

    // Week breakdown
    if (Object.keys(weeklyData).length > 0) {
        const maxWeekTotal = Math.max(...Object.values(weeklyData));
        summaryHTML += `
            <div class="week-breakdown">
                <h3>توزيع الأسابيع</h3>
                ${Object.entries(weeklyData).map(([weekStart, total]) => {
            const percentage = (total / maxWeekTotal) * 100;
            const weekStartDate = new Date(weekStart);
            const weekLabel = weekStartDate.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
            return `
                        <div class="week-row">
                            <div class="week-label">الأسبوع ${weekLabel}</div>
                            <div class="week-bar-container">
                                <div class="week-bar-fill" style="width: ${percentage}%;">
                                    ${percentage > 15 ? total.toFixed(0) + ' ج' : ''}
                                </div>
                            </div>
                            <div class="week-total">${total.toFixed(2)} ج</div>
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    }

    document.getElementById('monthlySummary').innerHTML = summaryHTML;
}

// Load expenses for selected date
function loadDateExpenses() {
    const selectedDate = document.getElementById('expenseDate').value;
    if (!selectedDate) return;

    currentDate = selectedDate;

    // Reset all quantities first
    items.forEach(item => item.quantity = 0);

    // Load expenses for the selected date
    const history = JSON.parse(localStorage.getItem('expensesHistory') || '[]');
    const dateExpense = history.find(h => h.date === selectedDate);

    if (dateExpense && dateExpense.items) {
        dateExpense.items.forEach(expenseItem => {
            const item = items.find(i => i.name === expenseItem.name && i.price === expenseItem.price);
            if (item) {
                item.quantity = expenseItem.quantity;
            }
        });
    }

    renderItems();
}

// Save expenses for selected date
function saveDateExpenses() {
    const selectedDate = document.getElementById('expenseDate').value;
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (total === 0) {
        alert("⚠️ لا توجد مصروفات!");
        return;
    }

    let history = JSON.parse(localStorage.getItem('expensesHistory') || '[]');
    if (!Array.isArray(history)) history = [];

    const existing = history.findIndex(h => h.date === selectedDate);
    const entry = {
        date: selectedDate,
        total: parseFloat(total.toFixed(2)),
        items: items.filter(i => i.quantity > 0).map(i => ({
            name: i.name,
            quantity: i.quantity,
            price: i.price,
            category: i.category
        }))
    };

    if (existing >= 0) {
        if (confirm("توجد مصروفات لهذا اليوم. استبدالها؟")) {
            history[existing] = entry;
        } else return;
    } else {
        history.push(entry);
    }

    localStorage.setItem('expensesHistory', JSON.stringify(history));
    alert("✅ تم الحفظ!");
    loadHistory();
    loadAnalytics();
    // Don't reset quantities automatically
}

// Update stats to show for selected date
function updateStats() {
    const todayTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('todayTotal').textContent = todayTotal.toFixed(2) + ' جنيه';
    document.getElementById('dailyTotalBanner').textContent = todayTotal.toFixed(2);
    document.getElementById('itemsCount').textContent = items.filter(i => i.quantity > 0).length;

    const history = JSON.parse(localStorage.getItem('expensesHistory') || '[]');
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthTotal = history
        .filter(h => h.date && h.date.startsWith(currentMonth))
        .reduce((sum, h) => sum + (h.total || 0), 0);
    document.getElementById('monthTotal').textContent = monthTotal.toFixed(2) + ' جنيه';

    const avgDaily = history.length > 0
        ? history.reduce((sum, h) => sum + (h.total || 0), 0) / history.length
        : 0;
    document.getElementById('avgDaily').textContent = avgDaily.toFixed(2) + ' جنيه';

    // Budget remaining
    if (monthlyBudget > 0) {
        const remaining = monthlyBudget - monthTotal;
        const statusClass = remaining < 0 ? 'danger' : remaining < monthlyBudget * 0.2 ? 'warning' : 'success';
        document.getElementById('budgetRemaining').innerHTML =
            `<span style="color: var(--${statusClass})">${remaining.toFixed(2)} ج</span>`;
    }
}
