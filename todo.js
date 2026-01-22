class TodoManager {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.currentFilter = 'all';
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
        
        // 篩選按鈕
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelector('.filter-btn.active').classList.remove('active');
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.render();
            });
        });
        
        // 其他動作按鈕
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
        this.inputEl.value = '';
        this.priorityEl.value = 'medium';
        this.saveTodos();
        this.render();
        this.inputEl.focus();
    }
    
    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;
        
        todo.completed = !todo.completed;
        todo.completedAt = todo.completed ? new Date().toISOString() : null;
        this.saveTodos();
        this.render();
    }
    
    deleteTodo(id) {
        if (confirm('確定要刪除這個待辦事項嗎？')) {
            this.todos = this.todos.filter(t => t.id !== id);
            this.saveTodos();
            this.render();
        }
    }
    
    editTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;
        
        const newText = prompt('編輯待辦事項：', todo.text);
        if (newText !== null && newText.trim()) {
            todo.text = newText.trim();
            this.saveTodos();
            this.render();
        }
    }
    
    clearDone() {
        if (confirm('確定要清除所有已完成的待辦事項嗎？')) {
            this.todos = this.todos.filter(t => !t.completed);
            this.saveTodos();
            this.render();
        }
    }
    
    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }
    
    exportTodos() {
        const dataStr = JSON.stringify(this.todos, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json;charset=utf-8'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `todos-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    
    importTodos() {
        document.getElementById('import-file').click();
    }
    
    handleImport(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedTodos = JSON.parse(event.target.result);
                if (Array.isArray(importedTodos)) {
                    this.todos = importedTodos.map(todo => ({
                        ...todo,
                        id: todo.id || Date.now()
                    }));
                    this.saveTodos();
                    this.render();
                    alert('匯入成功！');
                } else {
                    throw new Error('無效格式');
                }
            } catch (error) {
                alert('檔案格式錯誤，請確認是有效的JSON檔案');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }
    
    getFilteredTodos() {
        let filtered = this.todos;
        
        switch (this.currentFilter) {
            case 'pending': 
                filtered = filtered.filter(t => !t.completed); 
                break;
            case 'done': 
                filtered = filtered.filter(t => t.completed); 
                break;
            case 'today':
                const today = new Date().toDateString();
                filtered = filtered.filter(t => new Date(t.createdAt).toDateString() === today);
                break;
        }
        
        return filtered.sort((a, b) => {
            if (a.completed !== b.completed) return b.completed - a.completed;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
    }
    
    render() {
        const filteredTodos = this.getFilteredTodos();
        this.updateStats();
        
        if (filteredTodos.length === 0) {
            this.todosEl.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <p>${this.getEmptyMessage()}</p>
                </div>
            `;
            return;
        }
        
        this.todosEl.innerHTML = filteredTodos.map(todo => `
            <div class="todo-item ${todo.completed ? 'done' : ''}" data-id="${todo.id}">
                <input type="checkbox" class="todo-checkbox" 
                       ${todo.completed ? 'checked' : ''}>
                <div class="todo-content">
                    <div class="todo-text ${todo.completed ? 'completed' : ''}"
                         data-id="${todo.id}">${this.escapeHtml(todo.text)}</div>
                    <div class="todo-meta">
                        <span class="priority priority-${todo.priority}">${this.getPriorityLabel(todo.priority)}</span>
                        <span class="created-at">${this.formatDate(todo.createdAt)}</span>
                    </div>
                </div>
                <div class="todo-actions">
                    <button class="edit-btn" data-action="edit" data-id="${todo.id}" title="編輯">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" data-action="delete" data-id="${todo.id}" title="刪除">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // 事件委派
        const handleEvents = (e) => {
            // Toggle checkbox
            if (e.target.classList.contains('todo-checkbox')) {
                e.stopPropagation();
                const todoItem = e.target.closest('.todo-item');
                const id = parseInt(todoItem.dataset.id);
                this.toggleTodo(id);
            }
            
            // Action buttons
            const btn = e.target.closest('button[data-action]');
            if (btn) {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                const action = btn.dataset.action;
                
                if (action === 'edit') this.editTodo(id);
                if (action === 'delete') this.deleteTodo(id);
            }
            
            // Edit text (double click)
            if (e.target.classList.contains('todo-text') && !e.target.closest('button')) {
                if (e.detail === 2) {
                    e.stopPropagation();
                    const id = parseInt(e.target.dataset.id);
                    this.editTodo(id);
                }
            }
        };
        
        this.todosEl.removeEventListener('click', handleEvents);
        this.todosEl.removeEventListener('change', handleEvents);
        this.todosEl.addEventListener('click', handleEvents);
        this.todosEl.addEventListener('change', handleEvents);
    }
    
    getEmptyMessage() {
        const messages = {
            pending: '🎉 太棒了！所有任務都完成了！',
            done: '📭 還沒有完成任何任務',
            today: '📅 今天還沒有新增任務',
            all: '沒有待辦事項<br>開始新增你的第一個任務吧！'
        };
        return messages[this.currentFilter] || messages.all;
    }
    
    updateStats() {
        const total = this.todos.length;
        const done = this.todos.filter(t => t.completed).length;
        this.totalCountEl.textContent = total;
        this.doneCountEl.textContent = done;
    }
    
    getPriorityLabel(priority) {
        const labels = { low: '低', medium: '中', high: '高' };
        return labels[priority] || '中';
    }
    
    formatDate(isoString) {
        return new Date(isoString).toLocaleDateString('zh-TW', { 
            month: 'short', 
            day: 'numeric' 
        });
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

const todoManager = new TodoManager();
window.todoManager = todoManager;
