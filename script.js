// === Мобильное меню ===
const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');

burger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
});

// Закрыть меню при клике по ссылке
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// === Фикс шапки при прокрутке (добавим лёгкую тень) ===
const header = document.querySelector('.header');
window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
        header.style.boxShadow = '0 6px 20px rgba(201,24,74,.06)';
    } else {
        header.style.boxShadow = 'none';
    }
});

// === Форма записи ===
const form = document.getElementById('bookForm');
const note = document.getElementById('formNote');

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = data.get('name');
    const service = data.get('service');
    const date = data.get('date');

    note.textContent = `Спасибо, ${name}! Запись на "${service}" на ${date} принята. Мы свяжемся с тобой в ближайшее время.`;
    note.style.color = '#c9184a';
    form.reset();

    setTimeout(() => { note.textContent = ''; }, 7000);
});

// === Минимальная дата = сегодня ===
const dateInput = document.querySelector('input[type="date"]');
if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
}

// === Плавное появление секций при прокрутке ===
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('section').forEach(sec => {
    sec.style.opacity = '0';
    sec.style.transform = 'translateY(30px)';
    sec.style.transition = 'opacity .7s ease, transform .7s ease';
    observer.observe(sec);
});
