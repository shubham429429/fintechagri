const pageData = {
  login: 'Login',
  dashboard: 'Dashboard',
  financial: 'Financial Advisor',
  market: 'Crop Market',
  weather: 'Soil & Weather',
  forecast: 'Price Forecast',
  social: 'Social Hub',
  farm: 'My Farm',
};

const marketCatalog = {
  Onion: [
    ['Lasalgaon', 1340, '1,100 – 1,580', '4,200 q', '22 km', 'HOLD'],
    ['Pune APMC', 1420, '1,200 – 1,620', '2,800 q', '168 km', 'SELL 30%'],
    ['Solapur', 1180, '980 – 1,350', '3,100 q', '145 km', 'AVOID'],
    ['Hubli', 1480, '1,300 – 1,640', '1,900 q', '240 km', 'WATCH'],
    ['Belgaum FPO', 1520, '1,480 – 1,560', 'Pool', '280 km', 'POOL'],
  ],
  Wheat: [
    ['Pune APMC', 2480, '2,300 – 2,520', '3,100 q', '168 km', 'SELL NOW'],
    ['Nagpur', 2350, '2,200 – 2,450', '2,600 q', '320 km', 'HOLD'],
    ['Mumbai', 2520, '2,350 – 2,620', '1,200 q', '210 km', 'SELL 40%'],
    ['Solapur', 2220, '2,100 – 2,320', '2,900 q', '145 km', 'AVOID'],
    ['Nashik Coop', 2400, '2,310 – 2,420', 'Pool', '30 km', 'POOL'],
  ],
  Soybean: [
    ['Mumbai', 4520, '4,200 – 4,650', '1,750 q', '210 km', 'SELL'],
    ['Pune', 4390, '4,150 – 4,520', '2,200 q', '168 km', 'HOLD'],
    ['Delhi FPO', 4480, '4,200 – 4,530', '1,100 q', '825 km', 'SELL 20%'],
    ['Hyderabad', 4220, '4,000 – 4,330', '2,300 q', '650 km', 'AVOID'],
    ['Bengaluru', 4350, '4,120 – 4,460', '1,400 q', '820 km', 'WATCH'],
  ],
};

const priceRanges = {
  '30D': [1340, 1380, 1320, 1390, 1400, 1420, 1450, 1430, 1460, 1490, 1480, 1500, 1520, 1510, 1540, 1530, 1550, 1560, 1570, 1580, 1560, 1550, 1540, 1530, 1520, 1510, 1500, 1490, 1480, 1470],
  '90D': [1200, 1225, 1230, 1250, 1260, 1280, 1270, 1290, 1300, 1310, 1320, 1330, 1340, 1350, 1365, 1380, 1395, 1410, 1425, 1440, 1450, 1460, 1470, 1480, 1485, 1490, 1495, 1500, 1505, 1510],
  '1Y': [940, 960, 980, 1000, 1020, 1040, 1060, 1080, 1100, 1120, 1140, 1160, 1180, 1200, 1220, 1240, 1260, 1280, 1300, 1320, 1340, 1360, 1380, 1400, 1420, 1440, 1460, 1480, 1500, 1520],
};

let priceChart;
let forecastChart;
let sparklineChart;
let currentUser = null;

const farmerProfile = {
  name: 'Ramesh Singh',
  location: 'Nashik, Maharashtra',
  mobile: '+91 98765 43210',
  farmStock: { Onion: 180, Wheat: 75 },
  clusterStock: { Onion: 28400, Wheat: 11200 },
  marketData: {
    crop: 'Onion',
    arrivalsToday: '4,200 q',
    openPrice: 1320,
    closePrice: 1240,
    trend: 'Moderate oversupply with price pressure this afternoon',
    recommendedTransport: '70 q',
    recommendation: 'Partial sell: move lower-grade onions today, hold premium stock for 3 days.',
    recommendationLabel: 'Partial Sell',
    predictedShortage: 'Market needs about 3,800 q tomorrow to balance demand',
  },
  forecast: [
    { day: 'Tomorrow', detail: 'Moderate arrivals expected at Lasalgaon.', price: '₹1,330', signal: 'Hold' },
    { day: '2 Days', detail: 'Supply dips slightly on delayed trucks.', price: '₹1,340', signal: 'Watch' },
    { day: '4 Days', detail: 'Rain risk may tighten arrivals.', price: '₹1,360', signal: 'Buy' },
    { day: '7 Days', detail: 'Demand recovery should support prices.', price: '₹1,420', signal: 'Hold' },
  ],
  farmInventory: [
    { crop: 'Onion', qty: '180 q', quality: 'Premium', storage: 'Cold Storage', value: '₹81,000' },
    { crop: 'Wheat', qty: '75 q', quality: 'Good', storage: 'Farm Shed', value: '₹1,86,000' },
    { crop: 'Soybean', qty: '30 q', quality: 'Fair', storage: 'Bulk Bag', value: '₹1,32,000' },
  ],
  stockProjectedValue: '₹2,99,000',
  stockStorageLocation: 'Nashik Cold Storage',
};

function login() {
  const phone = document.getElementById('loginPhone')?.value.trim();
  const key = document.getElementById('loginFarmKey')?.value.trim();
  if (!phone || !key) {
    showToast('Please enter both mobile number and farm key.', 'warn');
    return;
  }
  currentUser = farmerProfile;
  showToast(`Welcome back, ${currentUser.name}! Loading your market dashboard.`, 'success');
  renderDashboard();
  updateMarketTable(currentUser.marketData.crop);
  updatePriceChart('30D');
  navigate('dashboard');
}

function renderDashboard() {
  const nameEl = document.getElementById('dashboardName');
  const subtitleEl = document.getElementById('dashboardSubtitle');
  const supplyQtyEl = document.getElementById('supplyTodayQty');
  const supplyDetailEl = document.getElementById('supplyTodayDetail');
  const priceOpenEl = document.getElementById('priceOpen');
  const priceCloseEl = document.getElementById('priceClose');
  const priceTrendEl = document.getElementById('priceTrendText');
  const farmStockQtyEl = document.getElementById('farmStockQty');
  const farmStockDetailEl = document.getElementById('farmStockDetail');
  const clusterStockQtyEl = document.getElementById('clusterStockQty');
  const clusterStockDetailEl = document.getElementById('clusterStockDetail');
  const insightTag = document.querySelector('.insight-tag');
  const insightStrong = document.querySelector('.ai-insight-banner strong');
  const insightText = document.querySelector('.ai-insight-banner .insight-content');

  if (!currentUser) return;

  if (nameEl) nameEl.textContent = currentUser.name;
  if (subtitleEl) subtitleEl.textContent = `Market guidance for ${currentUser.marketData.crop} in ${currentUser.location}.`;
  if (supplyQtyEl) supplyQtyEl.textContent = currentUser.marketData.arrivalsToday;
  if (supplyDetailEl) supplyDetailEl.textContent = `Arrivals at Lasalgaon today for ${currentUser.marketData.crop}`;
  if (priceOpenEl) priceOpenEl.textContent = `₹${currentUser.marketData.openPrice}`;
  if (priceCloseEl) priceCloseEl.textContent = `₹${currentUser.marketData.closePrice}`;
  if (priceTrendEl) priceTrendEl.textContent = currentUser.marketData.trend;
  if (farmStockQtyEl) farmStockQtyEl.textContent = `${currentUser.farmStock.Onion} q`;
  if (farmStockDetailEl) farmStockDetailEl.textContent = `Available onion stock on your farm and storage.`;
  if (clusterStockQtyEl) clusterStockQtyEl.textContent = `${currentUser.clusterStock.Onion.toLocaleString()} q`;
  if (clusterStockDetailEl) clusterStockDetailEl.textContent = `Estimated nearby 100km onion stock from connected farmers.`;
  const transportQtyEl = document.getElementById('transportQty');
  const transportDetailEl = document.getElementById('transportDetail');
  const recommendationBadge = document.getElementById('recommendationBadge');
  if (transportQtyEl) transportQtyEl.textContent = currentUser.marketData.recommendedTransport;
  if (transportDetailEl) transportDetailEl.textContent = currentUser.marketData.recommendation;
  if (recommendationBadge) recommendationBadge.textContent = currentUser.marketData.recommendationLabel || 'Partial Sell';

  if (insightTag) insightTag.textContent = 'Market Signal';
  if (insightStrong) insightStrong.textContent = 'Bring 70 q of onions to market today.';
  if (insightText) insightText.innerHTML = `${currentUser.marketData.recommendation} ${currentUser.marketData.predictedShortage}.`;
  renderForecastWidget();
}

function renderForecastWidget() {
  const list = document.getElementById('forecastList');
  if (!list || !currentUser || !currentUser.forecast) return;
  list.innerHTML = currentUser.forecast.map((item) => `
    <div class="forecast-item">
      <div>
        <div class="forecast-day">${item.day}</div>
        <div class="forecast-detail">${item.detail}</div>
      </div>
      <div class="forecast-meta">
        <span class="forecast-price">${item.price}</span>
        <span class="forecast-pill ${item.signal.toLowerCase()}">${item.signal}</span>
      </div>
    </div>
  `).join('');
}

function renderFarmPage() {
  if (!currentUser) return;
  const stockTotal = document.getElementById('stockTotalOnion');
  const stockValue = document.getElementById('stockProjectedValue');
  const stockLocation = document.getElementById('stockStorageLocation');
  const tbody = document.querySelector('#farmStockTable tbody');

  if (stockTotal) stockTotal.textContent = `${currentUser.farmStock.Onion} q`;
  if (stockValue) stockValue.textContent = currentUser.stockProjectedValue;
  if (stockLocation) stockLocation.textContent = currentUser.stockStorageLocation;
  if (tbody) {
    tbody.innerHTML = currentUser.farmInventory.map((row) => `
      <tr>
        <td>${row.crop}</td>
        <td>${row.qty}</td>
        <td>${row.quality}</td>
        <td>${row.storage}</td>
        <td>${row.value}</td>
      </tr>
    `).join('');
  }
}

function logout() {
  currentUser = null;
  showToast('You have been signed out.', 'info');
  navigate('login');
}

function ensureLoggedIn(pageId) {
  if (!currentUser && pageId !== 'login') {
    showToast('Please sign in before viewing this page.', 'warn');
    navigate('login');
    return false;
  }
  return true;
}

function navigate(pageId) {
  if (!ensureLoggedIn(pageId)) return;

  const pages = document.querySelectorAll('.page');
  pages.forEach((page) => page.classList.toggle('active', page.id === `page-${pageId}`));

  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach((item) => item.classList.toggle('active', item.dataset.page === pageId));

  const breadcrumb = document.getElementById('breadcrumb');
  breadcrumb.textContent = pageData[pageId] || 'Dashboard';

  if (pageId === 'dashboard') {
    renderDashboard();
  }

  if (pageId === 'farm') {
    renderFarmPage();
  }

  if (pageId === 'market') {
    showToast('Market data refreshed for your selected crop.', 'info');
  }

  if (pageId === 'financial') {
    document.getElementById('chatInput')?.focus();
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const main = document.querySelector('.main-content');
  sidebar.classList.toggle('collapsed');
  main.classList.toggle('collapsed');
}

function sendQuickMsg(message) {
  const input = document.getElementById('chatInput');
  input.value = message;
  sendMessage();
}

function buildChatMessage({sender, text, type = 'agent'}) {
  const wrapper = document.createElement('div');
  wrapper.className = `chat-msg ${type}-msg`;
  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.innerHTML = `<div class="msg-sender">${sender}</div><p>${text}</p><div class="msg-time">${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>`;
  if (type === 'agent') {
    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar agent-avatar';
    avatar.textContent = 'AI';
    wrapper.append(avatar, bubble);
  } else {
    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar user-avatar';
    avatar.textContent = 'RS';
    wrapper.append(bubble, avatar);
  }
  return wrapper;
}

function scrollChatBottom() {
  const chatMessages = document.getElementById('chatMessages');
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;

  const chatMessages = document.getElementById('chatMessages');
  chatMessages.appendChild(buildChatMessage({ sender: 'You', text, type: 'user' }));
  input.value = '';
  scrollChatBottom();

  const typingIndicator = document.getElementById('typingIndicator');
  typingIndicator.style.display = 'flex';
  scrollChatBottom();

  setTimeout(() => {
    typingIndicator.style.display = 'none';
    const response = generateAgentResponse(text);
    chatMessages.appendChild(buildChatMessage({ sender: 'Financial Advisor', text: response, type: 'agent' }));
    scrollChatBottom();
  }, 900 + Math.random() * 700);
}

function generateAgentResponse(userText) {
  const input = userText.toLowerCase();
  if (input.includes('savings') || input.includes('plan')) {
    return 'Based on your three-year goal, I recommend setting aside ₹7,200 per month and using a mix of Post Office RD and KVP. I can build a detailed harvest allocation plan if you want.';
  }
  if (input.includes('loan') || input.includes('kcc') || input.includes('credit')) {
    return 'You qualify for a KCC loan based on your profile. Estimate: ₹1.5 lakh with 7.5% interest. I can prepare your documentation checklist now.';
  }
  if (input.includes('scheme') || input.includes('government')) {
    return 'You are eligible for PM-Kisan, PMFBY, and KCC. I recommend applying for KCC and renewing PMFBY before the next sowing season.';
  }
  if (input.includes('market') || input.includes('sell') || input.includes('price')) {
    return 'Wheat is strong at Pune APMC. If you can transport within the next two days, selling 30% of your crop now is a safer option than waiting for the uncertain monsoon rally.';
  }
  return 'I recommend saving 30–35% of your harvest proceeds and reinvesting the rest into next season’s inputs. Would you like a step-by-step budget table for Rabi?';
}

function showToast(message, level = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${level}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

function updateMarketTable(crop) {
  const rows = document.querySelectorAll('.market-table tbody tr');
  const data = marketCatalog[crop] || marketCatalog.Onion;
  rows.forEach((row, idx) => {
    const cells = row.querySelectorAll('td');
    const rowData = data[idx] || data[0];
    if (!rowData) return;
    cells[0].innerHTML = `<strong>${rowData[0]}</strong><span class="mandi-state">${rowData[0].split(' ').pop().slice(0,2).toUpperCase()}</span>`;
    cells[1].textContent = `₹${rowData[1]}`;
    cells[1].className = `price ${rowData[1] >= 1400 ? 'up' : 'down'}`;
    cells[2].textContent = rowData[2];
    cells[3].textContent = rowData[3];
    cells[4].textContent = rowData[4];
    cells[5].innerHTML = `<span class="rec-tag ${rowData[5].includes('SELL') ? 'sell' : rowData[5].includes('HOLD') ? 'hold' : rowData[5].includes('AVOID') ? 'avoid' : 'watch'}">${rowData[5]}</span>`;
  });
  const recoCrop = document.querySelector('.reco-crop');
  if (recoCrop) recoCrop.textContent = `🌾 ${crop} · 20 Quintals`;
  showToast(`${crop} market view updated.`, 'success');
}

function updatePriceChart(rangeKey) {
  if (!priceChart) return;
  const labels = Array.from({ length: priceRanges[rangeKey].length }, (_, idx) => `Day ${idx + 1}`);
  priceChart.data.labels = labels;
  priceChart.data.datasets[0].data = priceRanges[rangeKey];
  priceChart.update();
  document.querySelectorAll('.chart-tab').forEach((tab) => tab.classList.toggle('active', tab.textContent === rangeKey));
  showToast(`${rangeKey} price trend loaded.`, 'info');
}

function initCharts() {
  const sparkCtx = document.getElementById('sparkline1');
  if (sparkCtx) {
    sparklineChart = new Chart(sparkCtx, {
      type: 'line',
      data: {
        labels: Array.from({ length: 12 }, (_, i) => `W${i + 1}`),
        datasets: [{ data: [28, 34, 32, 38, 42, 46, 44, 47, 52, 49, 53, 56], borderColor: '#D4A017', borderWidth: 2, fill: false, tension: 0.35 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { display: false } },
      },
    });
  }

  const priceCtx = document.getElementById('priceChart');
  if (priceCtx) {
    priceChart = new Chart(priceCtx, {
      type: 'line',
      data: {
        labels: priceRanges['30D'].map((_, idx) => `Day ${idx + 1}`),
        datasets: [{
          label: '₹/q',
          data: priceRanges['30D'],
          borderColor: '#40916C',
          backgroundColor: 'rgba(64,145,108,0.18)',
          fill: true,
          tension: 0.32,
          pointRadius: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#5A6A66' } },
          y: { grid: { color: 'rgba(27,67,50,0.08)' }, ticks: { color: '#5A6A66' } },
        },
      },
    });
  }

  const forecastCtx = document.getElementById('forecastChart');
  if (forecastCtx) {
    forecastChart = new Chart(forecastCtx, {
      type: 'line',
      data: {
        labels: ['Today', '7d', '14d', '21d', '30d', '45d', '60d', '75d', '90d'],
        datasets: [{
          label: 'Forecast',
          data: [1480, 1490, 1502, 1515, 1530, 1518, 1502, 1488, 1475],
          borderColor: '#D4A017',
          backgroundColor: 'rgba(212,160,23,0.22)',
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointBackgroundColor: '#D4A017',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#5A6A66' } },
          y: { grid: { color: 'rgba(212,160,23,0.15)' }, ticks: { color: '#5A6A66' } },
        },
      },
    });
  }
}

function bindEvents() {
  const cropSelect = document.querySelector('.market-table-card .select-crop');
  if (cropSelect) {
    cropSelect.addEventListener('change', (event) => updateMarketTable(event.target.value));
  }

  document.querySelectorAll('.chart-tab').forEach((tab) => {
    tab.addEventListener('click', () => updatePriceChart(tab.textContent));
  });

  document.querySelectorAll('.page-actions .btn, .action-list .btn, .buyer-list .btn, .social-sidebar .btn').forEach((button) => {
    button.addEventListener('click', (event) => {
      const label = event.currentTarget.textContent.trim();
      showToast(`${label} clicked. Feature coming soon!`, 'info');
    });
  });

  const notifButton = document.querySelector('.notif-btn');
  if (notifButton) {
    notifButton.addEventListener('click', () => showToast('You have 3 new notifications.', 'info'));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  initCharts();
  bindEvents();
  navigate('login');
});
