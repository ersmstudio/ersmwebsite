// Combined site script (extracted)
// Translations
const translations = {
    en: { direction: 'ltr', flag: '🇺🇸', code: 'EN' },
    ar: { direction: 'rtl', flag: '🇸🇦', code: 'AR' }
};

// State
let currentLang = localStorage.getItem('lang') || 'en';
let currentTheme = localStorage.getItem('theme') || 'dark';

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    applyLanguage(currentLang);
    applyTheme(currentTheme);
    initNavigation();
    if (document.getElementById('sliderTrack')) initSlider();
    if (document.querySelector('.filter-btn')) initFilter();
    initAnimations();
    initAuth();
});

// Language Toggle
function applyLanguage(lang) {
    const config = translations[lang];
    document.documentElement.lang = lang;
    document.documentElement.dir = config.direction;

    const langFlag = document.getElementById('langFlag');
    const langText = document.getElementById('langText');
    if (langFlag) langFlag.textContent = config.flag;
    if (langText) langText.textContent = config.code;

    document.querySelectorAll('[data-en][data-ar]').forEach(el => {
        el.textContent = el.getAttribute(`data-${lang}`);
    });

    document.querySelectorAll('input[data-ar-placeholder]').forEach(el => {
        const p = lang === 'ar' ? el.getAttribute('data-ar-placeholder') : el.getAttribute('placeholder');
        if (p) el.placeholder = p;
    });
}

// Theme Toggle
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
}

// Navigation (shared)
function initNavigation() {
    const navbar = document.getElementById('navbar');
    const menuIcon = document.getElementById('menuIcon');
    const navLinks = document.getElementById('navLinks');
    let lastScroll = 0;

    if (menuIcon) {
        menuIcon.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            menuIcon.textContent = navLinks.classList.contains('active') ? '✕' : '☰';
        });
    }

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        if (navbar) {
            if (currentScroll > 50) navbar.classList.add('scrolled'); else navbar.classList.remove('scrolled');
            if (currentScroll > lastScroll && currentScroll > 100) navbar.classList.add('hidden'); else navbar.classList.remove('hidden');
        }
        lastScroll = currentScroll;
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            if (navLinks) {
                navLinks.classList.remove('active');
                if (menuIcon) menuIcon.textContent = '☰';
            }
            if (window.innerWidth <= 968) {
                e.preventDefault();
                const href = link.getAttribute('href');
                setTimeout(() => { window.location.href = href; }, 150);
            }
        });
    });
}

// Slider (index pages)
function initSlider() {
    const track = document.getElementById('sliderTrack');
    if (!track) return;
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.slider-nav a');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const progressBar = document.getElementById('progressBar');

    let currentSlide = 0;
    let autoPlayInterval;
    let progressInterval;
    const slideDuration = 5000;

    function updateSlider(index) {
        track.style.transform = `translateX(-${index * 100}%)`;
        slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
        dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
        currentSlide = index;
        resetProgress();
    }

    function nextSlide() { updateSlider((currentSlide + 1) % slides.length); }
    function prevSlide() { updateSlider((currentSlide - 1 + slides.length) % slides.length); }

    function resetProgress() {
        if (!progressBar) return;
        progressBar.style.width = '0%';
        clearInterval(progressInterval);
        let progress = 0;
        const increment = 100 / (slideDuration / 50);
        progressInterval = setInterval(() => {
            progress += increment;
            progressBar.style.width = `${Math.min(progress, 100)}%`;
            if (progress >= 100) clearInterval(progressInterval);
        }, 50);
    }

    function startAutoPlay() { autoPlayInterval = setInterval(nextSlide, slideDuration); resetProgress(); }
    function resetAutoPlay() { clearInterval(autoPlayInterval); startAutoPlay(); }

    if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); resetAutoPlay(); });
    if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); resetAutoPlay(); });

    dots.forEach((dot, index) => dot.addEventListener('click', (e) => { e.preventDefault(); updateSlider(index); resetAutoPlay(); }));

    // Touch support
    let touchStartX = 0, touchEndX = 0;
    track.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
    track.addEventListener('touchend', (e) => { touchEndX = e.changedTouches[0].screenX; handleSwipe(); }, { passive: true });
    function handleSwipe() { const threshold = 50; if (touchEndX < touchStartX - threshold) { nextSlide(); resetAutoPlay(); } else if (touchEndX > touchStartX + threshold) { prevSlide(); resetAutoPlay(); } }

    const sliderWrapper = document.querySelector('.slider-wrapper');
    if (sliderWrapper) {
        sliderWrapper.addEventListener('mouseenter', () => { clearInterval(autoPlayInterval); clearInterval(progressInterval); });
        sliderWrapper.addEventListener('mouseleave', () => { startAutoPlay(); });
    }

    startAutoPlay();
}

// Filter (courses)
function initFilter() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const courseCards = document.querySelectorAll('.course-card');
    if (!filterBtns.length) return;

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.getAttribute('data-filter');
            courseCards.forEach(card => {
                const category = card.getAttribute('data-category');
                if (filter === 'all' || category === filter) {
                    card.style.display = 'flex';
                    setTimeout(() => { card.style.opacity = '1'; card.style.transform = 'translateY(0)'; }, 50);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                    setTimeout(() => { card.style.display = 'none'; }, 300);
                }
            });
        });
    });
}

// Animations & counters
function initAnimations() {
    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                if (entry.target.classList.contains('stats-bar')) {
                    entry.target.querySelectorAll('.stat-number').forEach(animateCounter);
                }
            }
        });
    }, observerOptions);
    document.querySelectorAll('.animate-on-scroll, .stats-bar').forEach(el => observer.observe(el));
}

function animateCounter(counter) {
    const target = +counter.getAttribute('data-target');
    const speed = 200;
    const inc = target / speed;
    let current = +counter.innerText || 0;
    if (current < target) {
        counter.innerText = Math.ceil(current + inc);
        setTimeout(() => animateCounter(counter), 20);
    } else {
        counter.innerText = target + '+';
    }
}

// Auth modal
function initAuth() {
    const modal = document.getElementById('authModal');
    const signinBtn = document.getElementById('signinBtn');
    const signupBtn = document.getElementById('signupBtn');
    const modalClose = document.getElementById('modalClose');
    const authTabs = document.querySelectorAll('.auth-tab');
    const signinForm = document.getElementById('signinForm');
    const signupForm = document.getElementById('signupForm');
    if (!modal) return;

    function openModal(tab = 'signin') { modal.classList.add('active'); document.body.style.overflow = 'hidden'; switchTab(tab); }
    function closeModal() { modal.classList.remove('active'); document.body.style.overflow = ''; }

    if (signinBtn) signinBtn.addEventListener('click', () => openModal('signin'));
    if (signupBtn) signupBtn.addEventListener('click', () => openModal('signup'));
    if (modalClose) modalClose.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    authTabs.forEach(tab => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));

    function switchTab(tab) {
        authTabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
        if (signinForm) signinForm.classList.toggle('active', tab === 'signin');
        if (signupForm) signupForm.classList.toggle('active', tab === 'signup');
    }

    if (signinForm) signinForm.addEventListener('submit', (e) => { e.preventDefault(); showToast('success', currentLang === 'en' ? 'Successfully signed in!' : 'تم تسجيل الدخول بنجاح!'); closeModal(); });
    if (signupForm) signupForm.addEventListener('submit', (e) => { e.preventDefault(); showToast('success', currentLang === 'en' ? 'Account created successfully!' : 'تم إنشاء الحساب بنجاح!'); closeModal(); });
}

// Toast
function showToast(type, message) {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toastIcon');
    const toastMessage = document.getElementById('toastMessage');
    if (!toast) return;
    toastIcon.textContent = type === 'success' ? '✓' : '✕';
    toastIcon.className = `toast-icon ${type}`;
    toastMessage.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Smooth scroll for anchors
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (!href.startsWith('#') || href === '#') return;
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

// Expose toggles globally for inline handlers if needed
window.applyLanguage = applyLanguage;
window.applyTheme = applyTheme;
window.showToast = showToast;
