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
            if (e.key === 'Enter') this.addTodo();
        });
        
        // 篩選
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelector('.filter-btn.active').classList.remove('active');
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.render();
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
        this.inputEl.value = '';
        this.saveTodos();
        this.render();
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
        this.todos = this.todos.filter(t => t.id !== id);
        this.saveTodos();
        this.render();
    }
    
    editTodo(id, newText) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.text = newText;
            this.saveTodos();
            this.render();
        }
    }
    
    clearDone() {
        this.todos = this.todos.filter(t => !t.completed);
        this.saveTodos();
        this.render();
    }
    
    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }
    
    exportTodos() {
        const dataStr = JSON.stringify(this.todos, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `todos-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
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
                this.todos = importedTodos;
                this.saveTodos();
                this.render();
                alert('匯入成功！');
            } catch (error) {
                alert('檔案格式錯誤，請確認是有效的JSON檔案');
            }
        };
        reader.readAsText(file);
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
                filtered = filtered.filter(t => {
                    const created = new Date(t.createdAt);
                    return created.toDateString() === today;
                });
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
            <div class="todo-item ${todo.completed ? 'done' : ''}" draggable="true">
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} 
                       onchange="todoManager.toggleTodo(${todo.id})">
                <div class="todo-content">
                    <div class="todo-text">${this.escapeHtml(todo.text)}</div>
                    <div class="todo-meta">
                        <span class="priority priority-${todo.priority}">${this.getPriorityLabel(todo.priority)}</span>
                        <span class="created-at">${this.formatDate(todo.createdAt)}</span>
                    </div>
                </div>
                <div class="todo-actions">
                    <button class="edit-btn" onclick="todoManager.editTodo(${todo.id})" title="編輯">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" onclick="todoManager.deleteTodo(${todo.id})" title="刪除">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    getEmptyMessage() {
        switch (this.currentFilter) {
            case 'pending': return '🎉 太棒了！所有任務都完成了！';
            case 'done': return '📭 還沒有完成任何任務';
            case 'today': return '📅 今天還沒有新增任務';
            default: return '沒有待辦事項<br>開始新增你的第一個任務吧！';
        }
    }
    
    updateStats() {
        const total = this.todos.length;
        const done = this.todos.filter(t => t.completed).length;
        this.totalCountEl.textContent = total;
        this.doneCountEl.textContent = done;
    }
    
    getPriorityLabel(priority) {
        const labels = {
            low: '低',
            medium: '中',
            high: '高'
        };
        return labels[priority] || '中';
    }
    
    formatDate(isoString) {
        const date = new Date(isoString);
        return date.toLocaleDateString('zh-TW', { 
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

// 啟動應用程式
const todoManager = new TodoManager();
