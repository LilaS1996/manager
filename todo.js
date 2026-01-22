class TodoManager {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.currentFilter = 'all';
        this.isEditing = null;
        this.init();
    }
    
    init() {
        this.todosEl = document.getElementById('todos-container');
        this.inputEl = document.getElementById('todo-input');
        this.priorityEl = document.getElementById('priority-select');
        this.addBtn = document.getElementById('add-btn');
        this.totalCountEl = document.getElementById('total-count');
        this.doneCountEl = document.getElementById('done-count');
        
        this.bindEvents();
        this.render();
        this.inputEl.focus();
    }
    
    bindEvents() {
        // 新增待辦
        this.addBtn.addEventListener('click', () => this.addTodo());
        this.inputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.addTodo();
            }
        });
        
        // 手機鍵盤適配
        this.inputEl.addEventListener('focus', () => {
            setTimeout(() => {
                this.todosEl.scrollTop = this.todosEl.scrollHeight;
            }, 300);
        });
        
        // 篩選
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelector('.filter-btn.active').classList.remove('active');
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.render();
            });
            
            // 手機長按切換篩選
            let pressTimer;
            btn.addEventListener('touchstart', () => {
                pressTimer = setTimeout(() => {
                    // 長按可以快速切換到該篩選
                }, 500);
            });
            btn.addEventListener('touchend', () => {
                clearTimeout(pressTimer);
            });
        });
        
        // 其他操作
        document.getElementById('clear-done').addEventListener('click', () => this.clearDone());
        document.getElementById('export-btn').addEventListener('click', () => this.exportTodos());
        document.getElementById('import-btn').addEventListener('click', () => this.importTodos());
        document.getElementById('import-file').addEventListener('change', (e) => this.handleImport(e));
    }
    
    addTodo() {
        const text = this.inputEl.value.trim();
        if (!text) return;
        
        const todo = {
            id: Date.now(),
            text: text,
            priority: this.priorityEl.value,
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null
        };
        
        this.todos.unshift(todo);
        this.inp
