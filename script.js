class TempHosting {
    constructor() {
        this.siteData = {};
        this.siteId = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkForSavedSite();
    }

    bindEvents() {
        // Обработчики для загрузки файлов
        document.getElementById('htmlFile').addEventListener('change', (e) => this.handleFileSelect(e, 'html'));
        document.getElementById('cssFile').addEventListener('change', (e) => this.handleFileSelect(e, 'css'));
        document.getElementById('jsFile').addEventListener('change', (e) => this.handleFileSelect(e, 'js'));
        
        // Основная кнопка загрузки
        document.getElementById('uploadBtn').addEventListener('click', () => this.handleUpload());
        
        // Кнопка использования кода из textarea
        document.getElementById('useCodeBtn').addEventListener('click', () => this.useCodeFromTextareas());
        
        // Кнопка копирования ссылки
        document.getElementById('copyBtn').addEventListener('click', () => this.copyLink());
        
        // Кнопки предпросмотра
        document.getElementById('previewBtn').addEventListener('click', () => this.showPreview());
        document.getElementById('openLink').addEventListener('click', (e) => {
            if (!this.siteId) e.preventDefault();
        });
        
        // Закрытие предпросмотра
        document.getElementById('closePreview').addEventListener('click', () => {
            document.getElementById('previewContainer').classList.add('hidden');
        });
        
        // Автоматическое обновление имен файлов
        ['htmlFile', 'cssFile', 'jsFile'].forEach(id => {
            document.getElementById(id).addEventListener('change', function(e) {
                const fileName = this.files[0] ? this.files[0].name : 'Файл не выбран';
                document.getElementById(id + 'Name').textContent = fileName;
            });
        });
    }

    handleFileSelect(event, type) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.siteData[type] = e.target.result;
            this.updateTextarea(type, e.target.result);
        };
        reader.readAsText(file);
    }

    updateTextarea(type, content) {
        const textareaId = type + 'Code';
        const textarea = document.getElementById(textareaId);
        if (textarea) {
            textarea.value = content;
        }
    }

    useCodeFromTextareas() {
        this.siteData = {
            html: document.getElementById('htmlCode').value,
            css: document.getElementById('cssCode').value,
            js: document.getElementById('jsCode').value
        };
        
        this.handleUpload();
    }

    async handleUpload() {
        // Проверка наличия HTML кода
        if (!this.siteData.html || this.siteData.html.trim() === '') {
            this.showToast('Пожалуйста, добавьте HTML код или загрузите HTML файл', 'error');
            return;
        }

        // Создаем уникальный ID для сайта
        this.siteId = 'site_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Сохраняем в sessionStorage (удалится после закрытия вкладки)
        sessionStorage.setItem(this.siteId, JSON.stringify(this.siteData));
        
        // Сохраняем ID последнего сайта
        sessionStorage.setItem('lastSiteId', this.siteId);
        
        // Генерируем URL
        const baseUrl = window.location.href.split('#')[0];
        const siteUrl = `${baseUrl}#${this.siteId}`;
        
        // Показываем результат
        this.showResult(siteUrl);
        
        this.showToast('Сайт успешно загружен! Ссылка скопирована в буфер обмена.', 'success');
        
        // Автоматически копируем ссылку
        await this.copyToClipboard(siteUrl);
    }

    showResult(url) {
        // Обновляем поле со ссылкой
        document.getElementById('siteLink').value = url;
        
        // Обновляем ссылку для открытия
        document.getElementById('openLink').href = url;
        
        // Показываем секцию с результатом
        document.getElementById('resultSection').classList.remove('hidden');
        
        // Прокручиваем к результату
        document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth' });
    }

    async copyLink() {
        const linkInput = document.getElementById('siteLink');
        await this.copyToClipboard(linkInput.value);
        this.showToast('Ссылка скопирована в буфер обмена!', 'success');
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            // Fallback для старых браузеров
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
    }

    showPreview() {
        if (!this.siteData.html) {
            this.showToast('Нет данных для предпросмотра', 'error');
            return;
        }

        const previewContainer = document.getElementById('previewContainer');
        const iframe = document.getElementById('sitePreview');
        
        // Создаем полный HTML документ
        const fullHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>${this.siteData.css || ''}</style>
            </head>
            <body>
                ${this.siteData.html || ''}
                <script>${this.siteData.js || ''}<\/script>
            </body>
            </html>
        `;

        // Открываем iframe и записываем в него HTML
        iframe.srcdoc = fullHtml;
        
        // Показываем контейнер предпросмотра
        previewContainer.classList.remove('hidden');
        
        // Прокручиваем к предпросмотру
        previewContainer.scrollIntoView({ behavior: 'smooth' });
    }

    checkForSavedSite() {
        // Проверяем, есть ли ID сайта в хеше URL
        const hash = window.location.hash.substring(1);
        if (hash && hash.startsWith('site_')) {
            this.loadSiteFromStorage(hash);
        }
        // Проверяем последний сохраненный сайт
        else {
            const lastSiteId = sessionStorage.getItem('lastSiteId');
            if (lastSiteId) {
                this.loadSiteFromStorage(lastSiteId);
            }
        }
    }

    loadSiteFromStorage(siteId) {
        try {
            const savedData = sessionStorage.getItem(siteId);
            if (savedData) {
                this.siteData = JSON.parse(savedData);
                this.siteId = siteId;
                
                // Заполняем текстовые поля
                if (this.siteData.html) document.getElementById('htmlCode').value = this.siteData.html;
                if (this.siteData.css) document.getElementById('cssCode').value = this.siteData.css;
                if (this.siteData.js) document.getElementById('jsCode').value = this.siteData.js;
                
                // Показываем результат
                const baseUrl = window.location.href.split('#')[0];
                const siteUrl = `${baseUrl}#${siteId}`;
                this.showResult(siteUrl);
                
                this.showToast('Сайт загружен из памяти браузера', 'info');
            }
        } catch (error) {
            console.error('Ошибка при загрузке сайта:', error);
        }
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        
        // Устанавливаем цвет в зависимости от типа
        if (type === 'error') {
            toast.style.background = 'linear-gradient(135deg, #ff4757 0%, #ff6b81 100%)';
        } else if (type === 'success') {
            toast.style.background = 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)';
        } else {
            toast.style.background = 'linear-gradient(135deg, #36d1dc 0%, #5b86e5 100%)';
        }
        
        // Показываем тост
        toast.style.display = 'block';
        
        // Скрываем через 4 секунды
        setTimeout(() => {
            toast.style.display = 'none';
        }, 4000);
    }
}

// Инициализация приложения когда DOM загружен
document.addEventListener('DOMContentLoaded', () => {
    const app = new TempHosting();
    
    // Добавляем обработчик для предупреждения при перезагрузке
    window.addEventListener('beforeunload', (e) => {
        if (sessionStorage.length > 0) {
            e.preventDefault();
            e.returnValue = 'Все загруженные сайты будут удалены после перезагрузки страницы. Вы уверены, что хотите покинуть страницу?';
        }
    });
});
