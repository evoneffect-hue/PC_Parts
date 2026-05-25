// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
let users = JSON.parse(localStorage.getItem('users')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let isLoginMode = true;
let isShowingFavorites = false;
let isAboutPageOpen = false;
let currentProduct = null;
let cart = [];

// API URL - путь к вашему API
const API_URL = '/pcshop/api/';

// ========== ОТКРЫТИЕ/ЗАКРЫТИЕ МОДАЛЬНОГО ОКНА ==========
function openModal() { 
    const modal = document.getElementById('authModal');
    const emailInput = document.getElementById('loginEmail');
    if (modal) modal.style.display = 'block';
    if (emailInput) emailInput.focus();
    showLoginForm();
}

function closeModal() { 
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'none';
    showLoginForm();
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function showToast(message, type = 'info', title = '') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const titles = { success: 'Успешно!', error: 'Ошибка!', warning: 'Внимание!', info: 'Информация' };
    
    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <div class="toast-content">
            <div class="toast-title">${title || titles[type]}</div>
            <div class="toast-message">${message}</div>
        </div>
        <span class="toast-close" onclick="this.parentElement.remove()">✕</span>
    `;
    
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function scrollToTop() { 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
}

function closeMenu() { 
    document.querySelector('nav ul')?.classList.remove('active'); 
    document.querySelector('.hamburger')?.classList.remove('active'); 
}

function setActiveNavLink(activeId) {
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.getElementById(activeId)?.classList.add('active');
}

// ========== ПЕРЕКЛЮЧЕНИЕ ФОРМ ==========
function showRegistrationForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const modalTitle = document.getElementById('modalTitle');
    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'block';
    if (modalTitle) modalTitle.textContent = 'Регистрация';
}

function showLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const modalTitle = document.getElementById('modalTitle');
    if (loginForm) loginForm.style.display = 'block';
    if (registerForm) registerForm.style.display = 'none';
    if (modalTitle) modalTitle.textContent = 'Вход в аккаунт';
}

// ========== ОБРАБОТКА ВХОДА (через API) ==========
const authForm = document.getElementById('authForm');
if (authForm) {
    authForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail')?.value.trim();
        const password = document.getElementById('loginPassword')?.value;
        
        if (!email || !password) {
            showToast('Заполните все поля', 'warning');
            return;
        }
        
        try {
            const response = await fetch(API_URL + 'login.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: email, password: password })
            });
            const data = await response.json();
            
            if (data.success) {
                currentUser = data.user;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                updateUIForLoggedInUser();
                await updateFavoriteButtons();
                closeModal();
                showToast(`Добро пожаловать, ${currentUser.username}!`, 'success', 'Вход выполнен');
                setTimeout(() => location.reload(), 500);
            } else {
                showToast(data.message || 'Неверный email или пароль', 'error');
            }
        } catch(err) {
            showToast('Ошибка соединения с сервером', 'error');
        }
    });
}

// ========== ОБРАБОТКА РЕГИСТРАЦИИ (через API) ==========
const registerFormElement = document.getElementById('registerFormElement');
if (registerFormElement) {
    registerFormElement.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('regName')?.value.trim();
        const surname = document.getElementById('regSurname')?.value.trim() || '';
        const email = document.getElementById('regEmail')?.value.trim();
        const password = document.getElementById('regPassword')?.value;
        const passwordConfirm = document.getElementById('regPasswordConfirm')?.value;
        
        if (!name || !email || !password || !passwordConfirm) {
            showToast('Заполните все обязательные поля', 'warning');
            return;
        }
        
        if (password !== passwordConfirm) {
            showToast('Пароли не совпадают', 'error');
            return;
        }
        
        if (password.length < 4) {
            showToast('Пароль должен быть не менее 4 символов', 'warning');
            return;
        }
        
        const username = surname ? name + ' ' + surname : name;
        
        try {
            const response = await fetch(API_URL + 'register.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    username: username,
                    name: name,
                    surname: surname,
                    email: email, 
                    password: password 
                })
            });
            const data = await response.json();
            
            if (data.success) {
                currentUser = data.user;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                updateUIForLoggedInUser();
                await updateFavoriteButtons();
                closeModal();
                showToast(`Добро пожаловать, ${name}!`, 'success', 'Регистрация успешна');
                setTimeout(() => location.reload(), 500);
            } else {
                showToast(data.message || 'Ошибка регистрации', 'error');
            }
        } catch(err) {
            showToast('Ошибка соединения с сервером', 'error');
        }
    });
}

function logout() {
    showToast('Вы вышли из аккаунта', 'info', 'До свидания!');
    currentUser = null;
    localStorage.removeItem('currentUser');
    location.reload();
}

// ========== АВАТАР В ШАПКЕ ==========
function updateNavAvatar() {
    const avatarImg = document.getElementById('navAvatarImg');
    const placeholder = document.getElementById('navAvatarPlaceholder');
    const userNameSpan = document.getElementById('navAvatarName');
    const navProfileLink = document.getElementById('nav-profile');
    const navAvatarContainer = document.getElementById('navAvatarContainer');
    
    if (!currentUser) return;
    
    if (userNameSpan) userNameSpan.textContent = currentUser.username;
    
    if (currentUser.avatar && currentUser.avatar !== '') {
        if (avatarImg) {
            avatarImg.src = currentUser.avatar;
            avatarImg.style.display = 'block';
        }
        if (placeholder) placeholder.style.display = 'none';
    } else {
        if (avatarImg) avatarImg.style.display = 'none';
        if (placeholder) placeholder.style.display = 'flex';
    }
    
    if (navProfileLink) navProfileLink.style.display = 'none';
    if (navAvatarContainer) navAvatarContainer.style.display = 'flex';
}

function updateUIForLoggedInUser() {
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) loginBtn.style.display = 'none';
    updateNavAvatar();
}

// ========== ГАМБУРГЕР МЕНЮ ==========
function toggleMenu() {
    document.querySelector('nav ul')?.classList.toggle('active');
    document.querySelector('.hamburger')?.classList.toggle('active');
}

// ========== ВОССТАНОВЛЕНИЕ ПАРОЛЯ ==========
function showForgotPasswordForm() { 
    closeModal(); 
    const forgotModal = document.getElementById('forgotModal');
    if (forgotModal) forgotModal.style.display = 'block'; 
}

function closeForgotModal() { 
    const forgotModal = document.getElementById('forgotModal');
    if (forgotModal) forgotModal.style.display = 'none'; 
}

async function sendResetLink() {
    const email = document.getElementById('forgotEmail')?.value.trim();
    const messageDiv = document.getElementById('forgotMessage');
    
    if (!email) {
        if (messageDiv) {
            messageDiv.textContent = 'Введите email';
            messageDiv.style.color = 'var(--danger-color)';
        }
        return;
    }
    
    try {
        const response = await fetch(API_URL + 'forgot_password.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        });
        const data = await response.json();
        
        if (messageDiv) {
            if (data.success) {
                messageDiv.textContent = data.message;
                messageDiv.style.color = 'var(--success-color)';
                setTimeout(() => closeForgotModal(), 3000);
            } else {
                messageDiv.textContent = data.message;
                messageDiv.style.color = 'var(--danger-color)';
            }
        }
    } catch(error) {
        if (messageDiv) {
            messageDiv.textContent = 'Ошибка соединения';
            messageDiv.style.color = 'var(--danger-color)';
        }
    }
}

// ========== РАБОТА С ИЗБРАННЫМ ==========
async function getFavoritesFromDB() {
    if (!currentUser) return [];
    try {
        const response = await fetch(API_URL + 'favorites.php?action=get', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUser.id })
        });
        return await response.json();
    } catch (error) {
        return [];
    }
}

async function addToFavoritesDB(productData) {
    if (!currentUser) return false;
    try {
        const response = await fetch(API_URL + 'favorites.php?action=add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUser.id, product_id: productData.id })
        });
        const data = await response.json();
        return data.success === true;
    } catch (error) {
        return false;
    }
}

async function removeFromFavoritesDB(productId) {
    if (!currentUser) return false;
    try {
        const response = await fetch(API_URL + 'favorites.php?action=remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUser.id, product_id: productId })
        });
        const data = await response.json();
        return data.success === true;
    } catch (error) {
        return false;
    }
}

async function updateFavoriteButtons() {
    if (!currentUser) return;
    const favorites = await getFavoritesFromDB();
    const favoriteIds = favorites.map(f => f.id);
    
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        try {
            const productData = JSON.parse(btn.dataset.product);
            if (favoriteIds.includes(productData.id)) {
                btn.classList.add('active');
                btn.innerHTML = '♥';
            } else {
                btn.classList.remove('active');
                btn.innerHTML = '♡';
            }
        } catch (e) {}
    });
}

async function toggleFavorite(button) {
    if (!currentUser) {
        showToast('Пожалуйста, войдите в аккаунт', 'warning');
        openModal();
        return;
    }
    
    const productData = JSON.parse(button.dataset.product);
    const isActive = button.classList.contains('active');
    
    if (isActive) {
        const success = await removeFromFavoritesDB(productData.id);
        if (success) {
            button.classList.remove('active');
            button.innerHTML = '♡';
            showToast(`${productData.name} удален из избранного`, 'info');
        }
    } else {
        const success = await addToFavoritesDB(productData);
        if (success) {
            button.classList.add('active');
            button.innerHTML = '♥';
            showToast(`${productData.name} добавлен в избранное`, 'success');
        }
    }
    
    if (isShowingFavorites) showFavorites();
}

async function toggleFavoriteFromDetail() {
    if (!currentUser) {
        showToast('Пожалуйста, войдите в аккаунт', 'warning');
        openModal();
        return;
    }
    const btn = document.querySelector('.detail-favorite-btn');
    if (!btn) return;
    const isActive = btn.innerHTML.includes('♥');
    
    if (isActive) {
        const success = await removeFromFavoritesDB(currentProduct.id);
        if (success) {
            btn.innerHTML = '♡ Добавить в избранное';
            showToast(`${currentProduct.name} удален из избранного`, 'info');
        }
    } else {
        const success = await addToFavoritesDB(currentProduct);
        if (success) {
            btn.innerHTML = '♥ В избранном';
            showToast(`${currentProduct.name} добавлен в избранное`, 'success');
        }
    }
    await updateFavoriteButtons();
}

async function clearAllFavorites() {
    if (!currentUser) {
        showToast('Пожалуйста, войдите в аккаунт', 'warning');
        openModal();
        return;
    }
    if (confirm('Вы уверены, что хотите удалить все товары из избранного?')) {
        const favorites = await getFavoritesFromDB();
        for (const product of favorites) {
            await removeFromFavoritesDB(product.id);
        }
        await updateFavoriteButtons();
        showFavorites();
        showToast('Все товары удалены из избранного', 'success');
    }
}

// ========== НАВИГАЦИЯ ==========
window.showCatalog = function() {
    const sections = ['about-page', 'product-page', 'advantages-section', 'profile-page', 'support-page', 'favorites-section'];
    sections.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
    
    const catalog = document.getElementById('catalog-section');
    if (catalog) catalog.style.display = 'block';
    
    const popular = document.getElementById('popular-products');
    const all = document.getElementById('all-products');
    if (popular) popular.style.display = 'block';
    if (all) all.style.display = 'block';
    
    document.getElementById('section-title').textContent = 'Категории:';
    const sectionHeader = document.querySelector('#catalog-section .section-header');
    if (sectionHeader) sectionHeader.style.display = 'flex';
    
    document.querySelectorAll('.category-btn:not(.clear-favorites-btn)').forEach(btn => btn.style.display = 'inline-flex');
    const clearBtn = document.getElementById('clear-favorites-btn');
    if (clearBtn) clearBtn.style.display = 'none';
    
    const noFavMsg = document.getElementById('noFavoritesMessage');
    if (noFavMsg) noFavMsg.classList.remove('show');
    
    isShowingFavorites = false;
    if (window.showCategory) showCategory('all');
    
    scrollToTop();
    closeMenu();
    setActiveNavLink('nav-catalog');
};

window.showFavorites = async function() {
    const user = localStorage.getItem('currentUser');
    if (!user) {
        showToast('Пожалуйста, войдите в аккаунт', 'warning');
        openModal();
        return;
    }
    
    currentUser = JSON.parse(user);
    
    const sections = ['about-page', 'product-page', 'advantages-section', 'profile-page', 'support-page'];
    sections.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
    
    const catalog = document.getElementById('catalog-section');
    if (catalog) catalog.style.display = 'block';
    
    const popular = document.getElementById('popular-products');
    const all = document.getElementById('all-products');
    if (popular) popular.style.display = 'none';
    if (all) all.style.display = 'none';
    
    isShowingFavorites = true;
    
    let favoritesData = [];
    try {
        const response = await fetch(API_URL + 'favorites.php?action=get', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUser.id })
        });
        favoritesData = await response.json();
    } catch(e) {}
    
    const favoritesSection = document.getElementById('favorites-section');
    if (favoritesSection) favoritesSection.style.display = 'block';
    
    document.getElementById('section-title').style.display = 'none';
    const sectionHeader = document.querySelector('#catalog-section .section-header');
    if (sectionHeader) sectionHeader.style.display = 'flex';
    
    document.querySelectorAll('.category-btn:not(.clear-favorites-btn)').forEach(btn => btn.style.display = 'none');
    const clearBtn = document.getElementById('clear-favorites-btn');
    if (clearBtn) clearBtn.style.display = 'inline-flex';
    
    const noFavMsg = document.getElementById('noFavoritesMessage');
    const favoritesList = document.getElementById('favoritesProductList');
    
    if (favoritesList) {
        favoritesList.innerHTML = '';
        if (favoritesData.length === 0) {
            if (noFavMsg) noFavMsg.classList.add('show');
            if (favoritesSection) favoritesSection.style.display = 'none';
        } else {
            if (noFavMsg) noFavMsg.classList.remove('show');
            favoritesData.forEach(product => {
                const card = document.createElement('div');
                card.className = 'product-card glass-card';
                card.setAttribute('onclick', 'showProductDetails(this)');
                card.innerHTML = `<button class="favorite-btn active" onclick="event.stopPropagation(); toggleFavorite(this)" data-product='${JSON.stringify(product).replace(/'/g, "&apos;")}'>♥</button><div class="product-image"><img src="${product.image}" alt="${product.name}"></div><h3>${product.name}</h3><div class="product-price">${Number(product.price).toLocaleString('ru-RU')} ₽</div>`;
                favoritesList.appendChild(card);
            });
        }
    }
    
    scrollToTop();
    closeMenu();
    setActiveNavLink('nav-favorites');
};

window.showAboutPage = function() {
    const sections = ['catalog-section', 'advantages-section', 'product-page', 'support-page', 'profile-page', 'favorites-section'];
    sections.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
    
    const about = document.getElementById('about-page');
    if (about) about.style.display = 'block';
    
    isShowingFavorites = false;
    scrollToTop();
    closeMenu();
    setActiveNavLink('nav-about');
};

// Функция для преимуществ
window.showAdvantages = function() {
    console.log('Переход в преимущества');
    
    const sections = ['about-page', 'product-page', 'support-page', 'profile-page', 'favorites-section'];
    for (let i = 0; i < sections.length; i++) {
        const el = document.getElementById(sections[i]);
        if (el) el.style.display = 'none';
    }
    
    const catalog = document.getElementById('catalog-section');
    if (catalog) catalog.style.display = 'block';
    
    const popular = document.getElementById('popular-products');
    const all = document.getElementById('all-products');
    if (popular) popular.style.display = 'none';
    if (all) all.style.display = 'none';
    
    const advantages = document.getElementById('advantages-section');
    if (advantages) advantages.style.display = 'block';
    
    const sectionHeader = document.querySelector('#catalog-section .section-header');
    if (sectionHeader) sectionHeader.style.display = 'none';
    
    const categoryBtns = document.querySelectorAll('.category-btn');
    for (let i = 0; i < categoryBtns.length; i++) {
        categoryBtns[i].style.display = 'none';
    }
    
    // СКРЫВАЕМ КНОПКУ "ОЧИСТИТЬ ИЗБРАННОЕ" В РАЗДЕЛЕ ПРЕИМУЩЕСТВ
    const clearBtn = document.getElementById('clear-favorites-btn');
    if (clearBtn) clearBtn.style.display = 'none';
    
    isShowingFavorites = false;
    window.scrollTo(0, 0);
    closeMenu();
    setActiveNavLink('nav-advantages');
};

window.showSupportPage = function() {
    const sections = ['catalog-section', 'about-page', 'product-page', 'advantages-section', 'profile-page', 'favorites-section'];
    sections.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
    
    const support = document.getElementById('support-page');
    if (support) support.style.display = 'block';
    
    isShowingFavorites = false;
    scrollToTop();
    closeMenu();
    setActiveNavLink('nav-support');
};

window.showProfilePage = async function() {
    if (!currentUser) {
        showToast('Пожалуйста, войдите в аккаунт', 'warning');
        openModal();
        return;
    }
    
    const sections = ['catalog-section', 'about-page', 'advantages-section', 'product-page', 'support-page', 'favorites-section'];
    sections.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
    
    const profilePage = document.getElementById('profile-page');
    if (profilePage) profilePage.style.display = 'block';
    
    document.getElementById('profileUsername').textContent = currentUser.username;
    document.getElementById('profileEmail').textContent = currentUser.email;
    document.getElementById('profileRegDate').textContent = `Дата регистрации: ${currentUser.created_at || new Date().toLocaleDateString('ru-RU')}`;
    document.getElementById('profileEditName').value = currentUser.username;
    document.getElementById('profileEditEmail').value = currentUser.email;
    document.getElementById('profileEditPhone').value = currentUser.phone || '';
    document.getElementById('profileEditCity').value = currentUser.city || '';
    document.getElementById('profileEditAddress').value = currentUser.address || '';
    
    if (currentUser.avatar) {
        document.getElementById('profileAvatarImg').src = currentUser.avatar;
    }
    
    await updateProfileStats();
    await loadProfileFavorites();
    await loadOrders();
    
    setupAvatarUpload();
    setupThemeToggles();
    applyTheme();
    
    isShowingFavorites = false;
    scrollToTop();
    closeMenu();
    setActiveNavLink('nav-profile');
};

// ========== ПОКАЗ КАТЕГОРИИ ==========
function showCategory(category) {
    isShowingFavorites = false;
    
    document.getElementById('advantages-section').style.display = 'none';
    document.getElementById('favorites-section').style.display = 'none';
    document.getElementById('noFavoritesMessage')?.classList.remove('show');
    
    document.getElementById('popular-products').style.display = 'block';
    document.getElementById('all-products').style.display = 'block';
    
    document.querySelectorAll('.product-card').forEach(card => {
        if (category === 'all') {
            card.classList.remove('hidden');
        } else {
            if (card.classList.contains(category)) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        }
    });
    
    document.querySelectorAll('.category-btn:not(.clear-favorites-btn)').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`.category-btn[data-category="${category}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    scrollToTop();
}

// ========== ДЕТАЛИ ТОВАРА ==========
function showProductDetails(card) {
    const productData = JSON.parse(card.querySelector('.favorite-btn').dataset.product);
    currentProduct = productData;
    
    const sections = ['catalog-section', 'about-page', 'advantages-section', 'support-page', 'profile-page', 'favorites-section'];
    sections.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
    
    const productPage = document.getElementById('product-page');
    if (productPage) productPage.style.display = 'block';
    
    const container = document.getElementById('productDetailContainer');
    if (container) {
        container.innerHTML = `
            <div class="product-detail-image"><img src="${productData.image}" alt="${productData.name}" onerror="this.src='https://via.placeholder.com/300x200?text=Нет+изображения'"></div>
            <div class="product-detail-info">
                <h1 class="product-detail-title">${productData.name}</h1>
                <div class="product-detail-price">${Number(productData.price).toLocaleString('ru-RU')} ₽</div>
                <div class="product-detail-description">${productData.description || 'Отличный товар для вашего компьютера'}</div>
                <div class="product-detail-actions">
                    <button class="detail-cart-btn" onclick="addToCartFromDetail()">🛒 В корзину</button>
                    <button class="detail-favorite-btn" onclick="toggleFavoriteFromDetail()">♡ Добавить в избранное</button>
                    <button class="back-to-catalog-btn" onclick="showCatalog()">← Вернуться в каталог</button>
                </div>
            </div>
        `;
    }
    
    (async () => {
        const favorites = await getFavoritesFromDB();
        const favBtn = document.querySelector('.detail-favorite-btn');
        if (favBtn && favorites.some(f => f.id === productData.id)) {
            favBtn.innerHTML = '♥ В избранном';
        }
    })();
    
    scrollToTop();
    closeMenu();
}

function handleProductPageClick(event) {
    const productPage = document.getElementById('product-page');
    if (event.target === productPage || event.target.classList?.contains('product-page')) {
        showCatalog();
    }
}

// ========== ПРОФИЛЬ ==========
async function updateProfileStats() {
    const favorites = await getFavoritesFromDB();
    const favCount = document.getElementById('profileFavoritesCount');
    if (favCount) favCount.textContent = favorites.length;
}

async function loadProfileFavorites() {
    const container = document.getElementById('profileFavoritesList');
    const favorites = await getFavoritesFromDB();
    
    if (!container) return;
    
    if (favorites.length === 0) {
        container.innerHTML = '<div class="empty-favorites"><span class="empty-icon">❤️</span><p>У вас пока нет избранных товаров</p><button class="glass-btn" onclick="showCatalog()">Перейти в каталог</button></div>';
        return;
    }
    
    container.innerHTML = '<div class="profile-favorites-grid"></div>';
    const grid = container.querySelector('.profile-favorites-grid');
    
    favorites.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card glass-card';
        card.style.cursor = 'pointer';
        card.onclick = () => {
            currentProduct = product;
            const container = document.getElementById('productDetailContainer');
            if (container) {
                container.innerHTML = `
                    <div class="product-detail-image"><img src="${product.image}" alt="${product.name}"></div>
                    <div class="product-detail-info">
                        <h1 class="product-detail-title">${product.name}</h1>
                        <div class="product-detail-price">${Number(product.price).toLocaleString('ru-RU')} ₽</div>
                        <div class="product-detail-actions">
                            <button class="detail-favorite-btn" onclick="toggleFavoriteFromDetail()">♥ В избранном</button>
                            <button class="back-to-catalog-btn" onclick="showCatalog()">← Вернуться в каталог</button>
                        </div>
                    </div>
                `;
            }
            document.getElementById('catalog-section').style.display = 'none';
            document.getElementById('profile-page').style.display = 'none';
            document.getElementById('product-page').style.display = 'block';
            scrollToTop();
        };
        card.innerHTML = `
            <div class="product-image"><img src="${product.image}" alt="${product.name}"></div>
            <h3>${product.name}</h3>
            <div class="product-price">${Number(product.price).toLocaleString('ru-RU')} ₽</div>
        `;
        grid.appendChild(card);
    });
}

async function loadOrders() {
    const container = document.getElementById('ordersList');
    if (!container) return;
    
    if (!currentUser) {
        container.innerHTML = '<div class="empty-orders"><span class="empty-icon">📦</span><p>Войдите в аккаунт</p></div>';
        return;
    }
    
    try {
        const response = await fetch(API_URL + 'orders.php?action=get', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUser.id })
        });
        const orders = await response.json();
        
        // Обновляем счётчик заказов в профиле
        const ordersCount = document.getElementById('profileOrdersCount');
        if (ordersCount) ordersCount.textContent = orders.length;
        
        if (orders.length === 0) {
            container.innerHTML = '<div class="empty-orders"><span class="empty-icon">📦</span><p>У вас пока нет заказов</p><button class="glass-btn" onclick="showCatalog()">Перейти в каталог</button></div>';
            return;
        }
        
        // Отображаем список заказов
        let html = '';
        orders.forEach(order => {
            html += `
                <div class="order-card glass-card">
                    <div class="order-header">
                        <span class="order-number">Заказ №${order.order_number}</span>
                        <span class="order-date">${new Date(order.created_at).toLocaleDateString('ru-RU')}</span>
                        <span class="order-status ${order.status === 'completed' ? 'status-completed' : 'status-pending'}">${order.status === 'completed' ? '✅ Выполнен' : '⏳ В обработке'}</span>
                    </div>
                    <div class="order-items">
                        ${order.items.map(item => `<div class="order-item">${item.name} x${item.quantity} — ${Number(item.price).toLocaleString('ru-RU')} ₽</div>`).join('')}
                    </div>
                    <div class="order-total">Итого: ${Number(order.total).toLocaleString('ru-RU')} ₽</div>
                </div>
            `;
        });
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Ошибка загрузки заказов:', error);
        container.innerHTML = '<div class="empty-orders"><span class="empty-icon">❌</span><p>Ошибка загрузки заказов</p></div>';
    }
}

async function confirmDeleteAccount() {
    if (confirm('⚠️ ВНИМАНИЕ! Это действие необратимо.\n\nВы уверены, что хотите удалить свой аккаунт?')) {
        try {
            const response = await fetch(API_URL + 'delete_account.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUser.id })
            });
            const result = await response.json();
            
            if (result.success) {
                localStorage.removeItem('currentUser');
                currentUser = null;
                showToast('Аккаунт удалён', 'success');
                setTimeout(() => location.reload(), 1500);
            } else {
                showToast('Ошибка удаления', 'error');
            }
        } catch(error) {
            showToast('Ошибка соединения', 'error');
        }
    }
}

// ========== АВАТАР ==========
let cropper = null;

function openCropModal(imageUrl) {
    const modal = document.getElementById('cropModal');
    const cropImage = document.getElementById('cropImage');
    if (!modal || !cropImage) return;
    
    cropImage.src = imageUrl;
    modal.style.display = 'block';
    
    cropImage.onload = function() {
        if (cropper) cropper.destroy();
        cropper = new Cropper(cropImage, {
            aspectRatio: 1,
            viewMode: 1,
            dragMode: 'move',
            cropBoxMovable: true,
            cropBoxResizable: true,
            guides: true,
            center: true,
            autoCropArea: 1,
            responsive: true
        });
    };
    
    if (cropImage.complete) cropImage.onload();
}

function closeCropModal() {
    const modal = document.getElementById('cropModal');
    if (modal) modal.style.display = 'none';
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
}

async function applyCrop() {
    if (!cropper) return;
    
    const canvas = cropper.getCroppedCanvas({ width: 300, height: 300 });
    const croppedImageUrl = canvas.toDataURL('image/jpeg', 0.9);
    
    showToast('Сохранение...', 'info');
    
    try {
        const response = await fetch(API_URL + 'upload_avatar.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: currentUser.id,
                avatar: croppedImageUrl
            })
        });
        const result = await response.json();
        
        if (result.success) {
            currentUser = result.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            document.getElementById('profileAvatarImg').src = result.avatar_path;
            updateNavAvatar();
            showToast('Аватар обновлён', 'success');
            closeCropModal();
        } else {
            showToast(result.message || 'Ошибка загрузки', 'error');
        }
    } catch (error) {
        showToast('Ошибка соединения', 'error');
    }
}

function setupAvatarUpload() {
    const avatarInput = document.getElementById('avatarUpload');
    if (!avatarInput) return;
    
    avatarInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.type.match('image.*')) {
            showToast('Выберите изображение', 'error');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            showToast('Файл не более 5 МБ', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(event) {
            openCropModal(event.target.result);
        };
        reader.readAsDataURL(file);
    });
}

// ========== ТЕМЫ ==========
function applyTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
    } else if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
    } else {
        document.body.classList.remove('light-theme', 'dark-theme');
    }
}

function setupThemeToggles() {
    const lightCheckbox = document.getElementById('settingsLightTheme');
    const darkCheckbox = document.getElementById('settingsDarkTheme');
    if (!lightCheckbox && !darkCheckbox) return;
    
    const savedTheme = localStorage.getItem('theme');
    if (lightCheckbox) lightCheckbox.checked = (savedTheme === 'light');
    if (darkCheckbox) darkCheckbox.checked = (savedTheme === 'dark');
    
    lightCheckbox?.addEventListener('change', function(e) {
        if (e.target.checked) {
            localStorage.setItem('theme', 'light');
            applyTheme();
            if (darkCheckbox) darkCheckbox.checked = false;
            showToast('Светлая тема включена', 'success');
        } else {
            localStorage.setItem('theme', 'default');
            applyTheme();
            showToast('Стандартная тема восстановлена', 'success');
        }
    });
    
    darkCheckbox?.addEventListener('change', function(e) {
        if (e.target.checked) {
            localStorage.setItem('theme', 'dark');
            applyTheme();
            if (lightCheckbox) lightCheckbox.checked = false;
            showToast('Тёмная тема включена', 'success');
        } else {
            localStorage.setItem('theme', 'default');
            applyTheme();
            showToast('Стандартная тема восстановлена', 'success');
        }
    });
}

// ========== ПРОКРУТКА ТОВАРОВ ==========
function scrollProducts(section, direction) {
    let productList;
    if (section === 'popular') productList = document.getElementById('popularProductList');
    else if (section === 'all') productList = document.getElementById('allProductList');
    else if (section === 'favorites') productList = document.getElementById('favoritesProductList');
    if (!productList) return;
    
    const card = productList.querySelector('.product-card');
    if (!card) return;
    
    const cardWidth = card.offsetWidth;
    const gap = 25;
    productList.scrollBy({ left: (cardWidth + gap) * direction, behavior: 'smooth' });
}

// ========== ФОРМАТИРОВАНИЕ ПОЛЕЙ КАРТЫ ==========
function formatCardNumber(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    let formatted = '';
    for (let i = 0; i < value.length; i++) {
        if (i > 0 && i % 4 === 0) formatted += ' ';
        formatted += value[i];
    }
    input.value = formatted;
}

function formatCardExpiry(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length >= 3) {
        input.value = value.slice(0, 2) + '/' + value.slice(2);
    } else {
        input.value = value;
    }
}

function formatCardCvv(input) {
    input.value = input.value.replace(/\D/g, '').slice(0, 3);
}

function formatPhoneForSbp(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    input.value = value;
}

// ========== ПЕРЕКЛЮЧЕНИЕ БЛОКОВ ОПЛАТЫ ==========
function togglePaymentBlocks() {
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
    const cardBlock = document.getElementById('cardPaymentBlock');
    const sbpBlock = document.getElementById('sbpPaymentBlock');
    
    if (cardBlock) cardBlock.style.display = paymentMethod === 'card' ? 'block' : 'none';
    if (sbpBlock) sbpBlock.style.display = paymentMethod === 'sbp' ? 'block' : 'none';
}

// ========== КОРЗИНА ==========
function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const total = cart.reduce((s, i) => s + i.quantity, 0);
        cartCount.textContent = total;
        cartCount.style.display = total > 0 ? 'flex' : 'none';
    }
}

async function addToCart(product) {
    if (!currentUser) {
        showToast('Войдите в аккаунт', 'warning');
        openModal();
        return;
    }
    
    try {
        await fetch(API_URL + 'cart.php?action=add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: currentUser.id,
                product_id: product.id,
                name: product.name,
                price: Number(product.price),
                image: product.image
            })
        });
        await loadCartFromDB();
        showToast(`${product.name} добавлен в корзину`, 'success');
    } catch (error) {
        console.error('Ошибка добавления:', error);
    }
}

async function removeFromCart(productId) {
    try {
        await fetch(API_URL + 'cart.php?action=remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: currentUser.id,
                product_id: productId
            })
        });
        await loadCartFromDB();
        if (document.getElementById('cartModal').style.display === 'block') {
            showCart();
        }
    } catch (error) {
        console.error('Ошибка удаления:', error);
    }
}

async function updateCartQuantity(productId, change) {
    const item = cart.find(i => i.product_id === productId);
    if (item) {
        const newQty = item.quantity + change;
        if (newQty <= 0) {
            await removeFromCart(productId);
        } else {
            try {
                await fetch(API_URL + 'cart.php?action=update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: currentUser.id,
                        product_id: productId,
                        quantity: newQty
                    })
                });
                await loadCartFromDB();
                if (document.getElementById('cartModal').style.display === 'block') {
                    showCart();
                }
            } catch (error) {
                console.error('Ошибка обновления:', error);
            }
        }
    }
}

async function loadCartFromDB() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(API_URL + 'cart.php?action=get', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUser.id })
        });
        cart = await response.json();
        updateCartCount();
    } catch (error) {
        console.error('Ошибка загрузки корзины:', error);
    }
}

function showCart() {
    const cartModal = document.getElementById('cartModal');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const emptyCart = document.getElementById('emptyCart');
    const cartContent = document.getElementById('cartContent');
    
    if (!cartModal) return;
    
    if (cart.length === 0) {
        if (emptyCart) emptyCart.style.display = 'block';
        if (cartContent) cartContent.style.display = 'none';
    } else {
        if (emptyCart) emptyCart.style.display = 'none';
        if (cartContent) cartContent.style.display = 'block';
        
        if (cartItems) {
            cartItems.innerHTML = '';
            let total = 0;
            cart.forEach(item => {
                total += item.price * item.quantity;
                const itemDiv = document.createElement('div');
                itemDiv.className = 'cart-item';
                itemDiv.innerHTML = `
                    <img src="${item.image}" class="cart-item-image">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">${Number(item.price).toLocaleString('ru-RU')} ₽</div>
                    </div>
                    <div class="cart-item-quantity">
                        <button class="cart-quantity-btn" onclick="updateCartQuantity('${item.product_id}', -1)">−</button>
                        <span>${item.quantity}</span>
                        <button class="cart-quantity-btn" onclick="updateCartQuantity('${item.product_id}', 1)">+</button>
                    </div>
                    <button class="cart-item-remove" onclick="removeFromCart('${item.product_id}')">🗑️</button>
                `;
                cartItems.appendChild(itemDiv);
            });
            if (cartTotal) cartTotal.textContent = `${total.toLocaleString('ru-RU')} ₽`;
        }
    }
    cartModal.style.display = 'block';
}

function closeCart() {
    document.getElementById('cartModal').style.display = 'none';
}

function addToCartFromDetail() {
    addToCart(currentProduct);
}

function checkout() {
    if (!currentUser) {
        showToast('Войдите в аккаунт', 'warning');
        closeCart();
        openModal();
        return;
    }
    if (cart.length === 0) {
        showToast('Корзина пуста', 'warning');
        return;
    }
    const nameInput = document.getElementById('checkoutName');
    const phoneInput = document.getElementById('checkoutPhone');
    if (nameInput) nameInput.value = currentUser.username || '';
    if (phoneInput) phoneInput.value = currentUser.phone || '';
    closeCart();
    const checkoutModal = document.getElementById('checkoutModal');
    if (checkoutModal) checkoutModal.style.display = 'block';
}

function closeCheckout() {
    const checkoutModal = document.getElementById('checkoutModal');
    if (checkoutModal) checkoutModal.style.display = 'none';
}

function moveToNext(input, index) {
    if (input.value.length === 1) {
        const next = document.querySelector(`.code-input:nth-child(${index + 1})`);
        if (next) next.focus();
    }
}

function closeCodeModal() {
    const codeModal = document.getElementById('codeModal');
    if (codeModal) codeModal.style.display = 'none';
    document.querySelectorAll('.code-input').forEach(i => i.value = '');
}

function confirmCode() {
    let code = '';
    document.querySelectorAll('.code-input').forEach(i => code += i.value);
    if (code.length !== 4) {
        showToast('Введите 4 цифры', 'warning');
        return;
    }
    if (code === '1234') {
        closeCodeModal();
        processOrder();
    } else {
        showToast('Неверный код', 'error');
    }
}

async function processOrder() {
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    
    try {
        const response = await fetch(API_URL + 'orders.php?action=create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: currentUser.id,
                items: cart.map(item => ({
                    id: item.product_id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity
                })),
                total: total,
                address: document.getElementById('checkoutAddress')?.value || '',
                phone: document.getElementById('checkoutPhone')?.value || ''
            })
        });
        const data = await response.json();
        
        if (data.success) {
            cart = [];
            updateCartCount();
            const successNumber = document.getElementById('successOrderNumber');
            if (successNumber) successNumber.textContent = data.order_number;
            const successModal = document.getElementById('successModal');
            if (successModal) successModal.style.display = 'block';
            closeCheckout();
        } else {
            showToast('Ошибка оформления заказа', 'error');
        }
    } catch (error) {
        showToast('Ошибка соединения', 'error');
    }
}

function closeSuccessModal() {
    const successModal = document.getElementById('successModal');
    if (successModal) successModal.style.display = 'none';
}

function addCartButton() {
    const contactInfo = document.querySelector('.contact-info-wrapper');
    if (!contactInfo || document.getElementById('cartBtn')) return;
    const cartBtn = document.createElement('button');
    cartBtn.id = 'cartBtn';
    cartBtn.className = 'cart-btn';
    cartBtn.onclick = showCart;
    cartBtn.innerHTML = `<span class="cart-icon">🛒</span><span class="cart-count" id="cartCount" style="display:none">0</span>`;
    contactInfo.appendChild(cartBtn);
}

// ========== ЧАТ ПОДДЕРЖКИ ==========
function toggleSupportChat() {
    const chat = document.getElementById('supportChat');
    const btn = document.getElementById('supportButton');
    if (!chat || !btn) return;
    if (chat.style.display === 'flex') {
        chat.style.display = 'none';
        btn.classList.remove('active');
    } else {
        chat.style.display = 'flex';
        btn.classList.add('active');
        const input = document.getElementById('supportInput');
        if (input) input.focus();
    }
}

function sendSupportMessage() {
    const input = document.getElementById('supportInput');
    const message = input?.value.trim();
    if (!message) return;
    addSupportMessage(message, 'user');
    if (input) input.value = '';
    setTimeout(() => {
        addSupportMessage('Спасибо за сообщение! Наш специалист ответит вам в ближайшее время.', 'bot');
    }, 800);
}

function handleSupportKeyPress(e) { if (e.key === 'Enter') sendSupportMessage(); }

function addSupportMessage(message, sender) {
    const container = document.getElementById('supportMessages');
    if (!container) return;
    const div = document.createElement('div');
    div.className = `support-message support-message-${sender}`;
    const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const userName = currentUser?.username || 'Гость';
    if (sender === 'bot') {
        div.innerHTML = `<div class="message-avatar">🤖</div><div class="message-content"><div class="message-sender">Техподдержка</div><div class="message-text">${message}</div><div class="message-time">${time}</div></div>`;
    } else {
        div.innerHTML = `<div class="message-avatar">${userName.charAt(0).toUpperCase()}</div><div class="message-content"><div class="message-sender">${userName}</div><div class="message-text">${message}</div><div class="message-time">${time}</div></div>`;
    }
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function toggleFaq(element) {
    const answer = element.closest('.faq-item')?.querySelector('.faq-answer');
    const icon = element.querySelector('.faq-icon');
    if (answer) {
        if (answer.style.display === 'block') {
            answer.style.display = 'none';
            if (icon) icon.textContent = '▼';
        } else {
            answer.style.display = 'block';
            if (icon) icon.textContent = '▲';
        }
    }
}

document.getElementById('supportForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('supportName')?.value;
    const email = document.getElementById('supportEmail')?.value;
    if (!name || !email) {
        showToast('Заполните имя и email', 'warning');
        return;
    }
    showToast('Ваше обращение отправлено!', 'success');
    this.reset();
    setTimeout(() => {
        toggleSupportChat();
        setTimeout(() => addSupportMessage('Здравствуйте! Я получил ваше обращение. Чем еще могу помочь?', 'bot'), 500);
    }, 1000);
});

// ========== ОФОРМЛЕНИЕ ЗАКАЗА ==========
document.getElementById('checkoutForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Собираем данные формы
    const name = document.getElementById('checkoutName')?.value.trim();
    const phone = document.getElementById('checkoutPhone')?.value.trim();
    const address = document.getElementById('checkoutAddress')?.value.trim();
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
    
    if (!name || !phone || !address) {
        showToast('Заполните все поля', 'warning');
        return;
    }
    
    // Проверка карты, если выбран способ "card"
    if (paymentMethod === 'card') {
        const cardNumber = document.getElementById('cardNumber')?.value.replace(/\s/g, '');
        const cardExpiry = document.getElementById('cardExpiry')?.value;
        const cardCvv = document.getElementById('cardCvv')?.value;
        
        if (!cardNumber || cardNumber.length < 16) {
            showToast('Введите корректный номер карты (16 цифр)', 'warning');
            return;
        }
        if (!cardExpiry || !cardExpiry.match(/^\d{2}\/\d{2}$/)) {
            showToast('Введите срок действия карты (ММ/ГГ)', 'warning');
            return;
        }
        if (!cardCvv || cardCvv.length < 3) {
            showToast('Введите CVV код (3 цифры)', 'warning');
            return;
        }
    }
    
    // Проверка телефона для СБП
    if (paymentMethod === 'sbp') {
        const sbpPhone = document.getElementById('sbpPhone')?.value.trim();
        if (!sbpPhone || sbpPhone.replace(/\D/g, '').length < 10) {
            showToast('Введите корректный номер телефона для СБП', 'warning');
            return;
        }
    }
    
    // Показываем модалку с кодом
    document.getElementById('codeModal').style.display = 'block';
});

// ========== ПРИВЯЗКА ФОРМАТИРОВАНИЯ К ПОЛЯМ ==========
const cardNumberInput = document.getElementById('cardNumber');
const cardExpiryInput = document.getElementById('cardExpiry');
const cardCvvInput = document.getElementById('cardCvv');
const sbpPhoneInput = document.getElementById('sbpPhone');

if (cardNumberInput) {
    cardNumberInput.addEventListener('input', () => formatCardNumber(cardNumberInput));
}
if (cardExpiryInput) {
    cardExpiryInput.addEventListener('input', () => formatCardExpiry(cardExpiryInput));
}
if (cardCvvInput) {
    cardCvvInput.addEventListener('input', () => formatCardCvv(cardCvvInput));
}
if (sbpPhoneInput) {
    sbpPhoneInput.addEventListener('input', () => formatPhoneForSbp(sbpPhoneInput));
}

// ========== ПРИВЯЗКА ПЕРЕКЛЮЧЕНИЯ БЛОКОВ ОПЛАТЫ ==========
document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
    radio.addEventListener('change', togglePaymentBlocks);
});
togglePaymentBlocks();

// ========== ВКЛАДКИ ЛИЧНОГО КАБИНЕТА ==========
function showProfileTab(tab) {
    // Скрываем все вкладки
    document.querySelectorAll('.profile-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    // Убираем активный класс со всех кнопок
    document.querySelectorAll('.profile-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Показываем выбранную вкладку
    const activeTab = document.getElementById(`profile-${tab}-tab`);
    if (activeTab) activeTab.classList.add('active');
    
    // Активируем кнопку, по которой кликнули
    const buttons = document.querySelectorAll('.profile-tab');
    for (let i = 0; i < buttons.length; i++) {
        const btn = buttons[i];
        if (btn.textContent.trim().toLowerCase().includes(tab.toLowerCase()) ||
            (tab === 'info' && btn.textContent.includes('Личные данные')) ||
            (tab === 'orders' && btn.textContent.includes('История заказов')) ||
            (tab === 'favorites' && btn.textContent.includes('Избранное')) ||
            (tab === 'settings' && btn.textContent.includes('Настройки'))) {
            btn.classList.add('active');
            break;
        }
    }
    
    // Если открыли вкладку избранного — подгружаем данные
    if (tab === 'favorites') {
        loadProfileFavorites();
    }
    // Если открыли историю заказов — подгружаем заказы
    if (tab === 'orders') {
        loadOrders();
    }
}

// Привязываем обработчики к кнопкам вкладок
function bindProfileTabs() {
    const tabs = document.querySelectorAll('.profile-tab');
    for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        const text = tab.textContent.trim();
        tab.removeEventListener('click', window._profileTabHandler);
        window._profileTabHandler = function(e) {
            e.preventDefault();
            if (text.includes('Личные данные')) showProfileTab('info');
            else if (text.includes('История заказов')) showProfileTab('orders');
            else if (text.includes('Избранное')) showProfileTab('favorites');
            else if (text.includes('Настройки')) showProfileTab('settings');
        };
        tab.addEventListener('click', window._profileTabHandler);
    }
}

// Доработанная загрузка заказов с обновлением счётчика
async function loadOrders() {
    const container = document.getElementById('ordersList');
    if (!container) return;
    
    if (!currentUser) {
        container.innerHTML = '<div class="empty-orders"><span class="empty-icon">📦</span><p>Войдите в аккаунт</p></div>';
        return;
    }
    
    try {
        const response = await fetch(API_URL + 'orders.php?action=get', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUser.id })
        });
        const orders = await response.json();
        
        // Обновляем счётчик заказов в профиле
        const ordersCountElem = document.getElementById('profileOrdersCount');
        if (ordersCountElem) ordersCountElem.textContent = orders.length;
        
        if (orders.length === 0) {
            container.innerHTML = '<div class="empty-orders"><span class="empty-icon">📦</span><p>У вас пока нет заказов</p><button class="glass-btn" onclick="showCatalog()">Перейти в каталог</button></div>';
            return;
        }
        
        let html = '';
        for (let i = 0; i < orders.length; i++) {
            const order = orders[i];
            html += `
                <div class="order-card glass-card">
                    <div class="order-header">
                        <span class="order-number">Заказ №${order.order_number}</span>
                        <span class="order-date">${new Date(order.created_at).toLocaleDateString('ru-RU')}</span>
                        <span class="order-status ${order.status === 'completed' ? 'status-completed' : 'status-pending'}">${order.status === 'completed' ? '✅ Выполнен' : '⏳ В обработке'}</span>
                    </div>
                    <div class="order-items">
                        ${order.items.map(item => `<div class="order-item">${item.name} x${item.quantity} — ${Number(item.price).toLocaleString('ru-RU')} ₽</div>`).join('')}
                    </div>
                    <div class="order-total">Итого: ${Number(order.total).toLocaleString('ru-RU')} ₽</div>
                </div>
            `;
        }
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Ошибка загрузки заказов:', error);
        container.innerHTML = '<div class="empty-orders"><span class="empty-icon">❌</span><p>Ошибка загрузки заказов</p></div>';
    }
}

// Доработанная загрузка избранного в профиле
async function loadProfileFavorites() {
    const container = document.getElementById('profileFavoritesList');
    if (!container) return;
    
    const favorites = await getFavoritesFromDB();
    
    // Обновляем счётчик избранного в профиле
    const favCountElem = document.getElementById('profileFavoritesCount');
    if (favCountElem) favCountElem.textContent = favorites.length;
    
    if (favorites.length === 0) {
        container.innerHTML = '<div class="empty-favorites"><span class="empty-icon">❤️</span><p>У вас пока нет избранных товаров</p><button class="glass-btn" onclick="showCatalog()">Перейти в каталог</button></div>';
        return;
    }
    
    let html = '<div class="profile-favorites-grid">';
    for (let i = 0; i < favorites.length; i++) {
        const product = favorites[i];
        html += `
            <div class="product-card glass-card" style="cursor:pointer;" onclick="showProductFromProfile('${product.id}')">
                <div class="product-image"><img src="${product.image}" alt="${product.name}"></div>
                <h3>${product.name}</h3>
                <div class="product-price">${Number(product.price).toLocaleString('ru-RU')} ₽</div>
            </div>
        `;
    }
    html += '</div>';
    container.innerHTML = html;
}

// Открытие товара из профиля
window.showProductFromProfile = function(productId) {
    showCatalog();
    setTimeout(() => {
        const productCard = document.querySelector(`.product-card[data-id="${productId}"]`);
        if (productCard) {
            showProductDetails(productCard);
        }
    }, 100);
};

// При загрузке страницы привязываем вкладки
const originalOnload = window.onload;
window.onload = async function() {
    if (originalOnload) await originalOnload();
    bindProfileTabs();
    // Обновляем счётчики при загрузке профиля
    if (currentUser) {
        await loadOrders();
        await loadProfileFavorites();
    }
};

// ========== ИНИЦИАЛИЗАЦИЯ ==========
window.onload = async function() {
    addCartButton();
    if (currentUser) {
        updateUIForLoggedInUser();
        await updateFavoriteButtons();
        await loadCartFromDB();
        applyTheme();
        setupThemeToggles();
    }
    showCatalog();
};

window.onclick = function(event) {
    const authModal = document.getElementById('authModal');
    if (event.target == authModal) closeModal();
    const forgotModal = document.getElementById('forgotModal');
    if (event.target == forgotModal) closeForgotModal();
    const cropModal = document.getElementById('cropModal');
    if (event.target == cropModal) closeCropModal();
    const cartModal = document.getElementById('cartModal');
    if (event.target == cartModal) closeCart();
    const checkoutModal = document.getElementById('checkoutModal');
    if (event.target == checkoutModal) closeCheckout();
    const codeModal = document.getElementById('codeModal');
    if (event.target == codeModal) closeCodeModal();
    const successModal = document.getElementById('successModal');
    if (event.target == successModal) closeSuccessModal();
};

window.onscroll = function() {
    const backToTop = document.querySelector('.back-to-top');
    if (backToTop) {
        if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
            backToTop.style.display = 'flex';
        } else {
            backToTop.style.display = 'none';
        }
    }
};