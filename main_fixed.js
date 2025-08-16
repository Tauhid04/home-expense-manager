// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const elements = {
        mainApp: document.getElementById('main-app'),
        loginSection: document.querySelector('.login-section'),
        loginForm: document.getElementById('login-form'),
        loginError: document.getElementById('login-error'),
        currentUserSpan: document.getElementById('current-user'),
        expenseForm: document.getElementById('expense-form'),
        multiItemsDiv: document.getElementById('multi-items'),
        expensesTableBody: document.getElementById('expenses-table-body'),
        noExpensesDiv: document.getElementById('no-expenses'),
        monthlySummary: document.getElementById('monthly-summary'),
        individualSummary: document.getElementById('individual-summary')
    };

    // App State
    let currentUser = null;
    let expenses = [];

    // Initialize the application
    function initializeApp() {
        // Check for existing session
        loadUserSession();
        
        // Set up event listeners
        setupEventListeners();
        
        // Set today's date in expense form
        setTodayDate();
    }

    // Event Listeners Setup
    function setupEventListeners() {
        // Tab switching
        const signInBtn = document.getElementById('show-signin');
        const signUpBtn = document.getElementById('show-signup');
        if (signInBtn && signUpBtn) {
            signInBtn.onclick = () => switchTab('signin');
            signUpBtn.onclick = () => switchTab('signup');
        }

        // Form submissions
        const signupForm = document.getElementById('signup-form');
        if (signupForm) {
            signupForm.onsubmit = function(e) {
                e.preventDefault();
                handleSignup();
            };
        }
        
        if (elements.loginForm) {
            elements.loginForm.onsubmit = handleLogin;
        }
        
        if (elements.expenseForm) {
            elements.expenseForm.onsubmit = handleExpenseSubmit;
        }

        // Add new expense row
        const addItemBtn = document.getElementById('add-item-btn');
        if (addItemBtn) {
            addItemBtn.onclick = addExpenseRow;
        }

        // Delete expense
        if (elements.expensesTableBody) {
            elements.expensesTableBody.onclick = handleExpenseDelete;
        }

        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
    }

    // UI Functions
    function showMessage(message, isError = true) {
        elements.loginError.textContent = message;
        elements.loginError.className = isError ? 'error' : 'success';
    }

    function switchTab(tab) {
        const isSignIn = tab === 'signin';
        
        // Toggle active state of tabs
        document.getElementById('show-signin').classList.toggle('active', isSignIn);
        document.getElementById('show-signup').classList.toggle('active', !isSignIn);
        
        // Toggle visibility of forms
        document.getElementById('login-form').style.display = isSignIn ? 'block' : 'none';
        document.getElementById('signup-form').style.display = isSignIn ? 'none' : 'block';
        
        // Clear any error messages
        showMessage('');
        
        // Reset form fields
        if (isSignIn) {
            document.getElementById('login-username').value = '';
            document.getElementById('login-password').value = '';
        } else {
            document.getElementById('signup-fullname').value = '';
            document.getElementById('signup-username').value = '';
            document.getElementById('signup-password').value = '';
        }
    }

    function showMainApp() {
        elements.mainApp.style.display = 'block';
        elements.loginSection.style.display = 'none';
        loadExpenses();
        renderExpenses();
        renderSummary();
    }

    function showLoginPage() {
        elements.mainApp.style.display = 'none';
        elements.loginSection.style.display = 'block';
        expenses = [];
        showMessage('');
    }

    // User Management
    function handleSignup(e) {
        const fullname = document.getElementById('signup-fullname').value.trim();
        const username = document.getElementById('signup-username').value.trim().toLowerCase();
        const password = document.getElementById('signup-password').value;

        if (!fullname || !username || !password) {
            showMessage('Please fill all fields');
            return;
        }

        if (username.length < 3) {
            showMessage('Username must be at least 3 characters long');
            return;
        }

        if (password.length < 6) {
            showMessage('Password must be at least 6 characters long');
            return;
        }

        const users = getUsers();
        
        if (users[username]) {
            showMessage('Username already exists');
            return;
        }

        try {
            users[username] = { fullname, password };
            localStorage.setItem('users', JSON.stringify(users));
            showMessage('✓ Account created successfully!', false);

            // Clear form
            document.getElementById('signup-fullname').value = '';
            document.getElementById('signup-username').value = '';
            document.getElementById('signup-password').value = '';

            // Switch to login
            setTimeout(() => switchTab('signin'), 1500);
        } catch (error) {
            console.error('Signup error:', error);
            showMessage('Error creating account. Please try again.');
        }
    }

    function handleLogin(e) {
        e.preventDefault();

        const username = document.getElementById('login-username').value.trim().toLowerCase();
        const password = document.getElementById('login-password').value;

        if (!username || !password) {
            showMessage('Please enter username and password');
            return;
        }

        const users = getUsers();
        const user = users[username];

        if (!user) {
            showMessage('User not found');
            return;
        }

        if (user.password !== password) {
            showMessage('Incorrect password');
            return;
        }

        try {
            // Store logged in user
            currentUser = { username, fullname: user.fullname };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            showMessage('✓ Login successful!', false);
            elements.currentUserSpan.innerHTML = `<i class="fas fa-user"></i> ${user.fullname}`;
            
            // Clear login form
            document.getElementById('login-username').value = '';
            document.getElementById('login-password').value = '';

            setTimeout(showMainApp, 1000);
        } catch (error) {
            console.error('Login error:', error);
            showMessage('Error during login. Please try again.');
        }
    }

    function handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            try {
                // Show loading feedback
                const logoutBtn = document.getElementById('logout-btn');
                if (logoutBtn) {
                    logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging out...';
                    logoutBtn.disabled = true;
                }
                
                // Clear user data
                currentUser = null;
                localStorage.removeItem('currentUser');
                
                // Clear expenses from memory
                expenses = [];
                
                // Add a small delay for visual feedback
                setTimeout(() => {
                    showLoginPage();
                    switchTab('signin');
                    
                    // Reset logout button
                    if (logoutBtn) {
                        logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
                        logoutBtn.disabled = false;
                    }
                    
                    // Show success message
                    showMessage('✓ Logged out successfully!', false);
                }, 500);
                
            } catch (error) {
                console.error('Logout error:', error);
                alert('Error during logout. Please try again.');
                
                // Reset logout button in case of error
                const logoutBtn = document.getElementById('logout-btn');
                if (logoutBtn) {
                    logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
                    logoutBtn.disabled = false;
                }
            }
        }
    }

    // Expense Management
    function handleExpenseSubmit(e) {
        e.preventDefault();
        
        if (!currentUser) return;

        const rows = elements.multiItemsDiv.querySelectorAll('.expense-row');
        let added = false;

        rows.forEach(row => {
            const amount = row.querySelector('.amount').value.trim();
            const category = row.querySelector('.category').value;
            const date = row.querySelector('.date').value;
            const description = row.querySelector('.description').value.trim();

            if (!amount || !category || !date) return;

            expenses.unshift({
                amount: parseFloat(amount),
                category,
                date,
                description,
                username: currentUser.username
            });
            added = true;
        });

        if (added) {
            saveExpenses();
            renderExpenses();
            resetExpenseForm();
            showMessage('✓ Expenses saved successfully!', false);
        } else {
            showMessage('Please fill at least one complete expense row.');
        }
    }

    function handleExpenseDelete(e) {
        if (!currentUser || !e.target.classList.contains('delete-btn')) return;
        
        if (confirm('Are you sure you want to delete this expense?')) {
            const idx = e.target.getAttribute('data-idx');
            expenses.splice(idx, 1);
            saveExpenses();
            renderExpenses();
        }
    }

    function addExpenseRow() {
        const row = document.createElement('div');
        row.className = 'expense-row fade-in';
        row.innerHTML = `
            <input type="number" class="expense-input amount" 
                   placeholder="Amount (Tk)" min="0.01" step="0.01" required>
            <select class="expense-input category" required>
                <option value="" disabled selected>Category</option>
                <option value="food">Food</option>
                <option value="transport">Transport</option>
                <option value="bills">Bills</option>
                <option value="shopping">Shopping</option>
                <option value="entertainment">Entertainment</option>
                <option value="health">Health</option>
                <option value="other">Other</option>
            </select>
            <input type="date" class="expense-input date" required>
            <input type="text" class="expense-input description" 
                   placeholder="Description" maxlength="40">
            <button type="button" class="delete-btn remove-row">
                <i class="fas fa-trash"></i>
            </button>
        `;
        elements.multiItemsDiv.appendChild(row);
        row.querySelector('.date').valueAsDate = new Date();

        // Show all remove buttons if there's more than one row
        if (elements.multiItemsDiv.children.length > 1) {
            elements.multiItemsDiv.querySelectorAll('.remove-row').forEach(btn => {
                btn.style.display = 'block';
            });
        }
    }

    function resetExpenseForm() {
        elements.multiItemsDiv.innerHTML = '';
        addExpenseRow();
        const removeBtn = elements.multiItemsDiv.querySelector('.remove-row');
        if (removeBtn) removeBtn.style.display = 'none';
    }

    // Data Management
    function getUsers() {
        return JSON.parse(localStorage.getItem('users') || '{}');
    }

    function loadUserSession() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            elements.currentUserSpan.innerHTML = `<i class="fas fa-user"></i> ${currentUser.fullname}`;
            showMainApp();
        } else {
            showLoginPage();
        }
    }

    function loadExpenses() {
        if (!currentUser) return;
        
        try {
            const savedExpenses = localStorage.getItem(`expenses_${currentUser.username}`);
            expenses = savedExpenses ? JSON.parse(savedExpenses) : [];
        } catch (error) {
            console.error('Error loading expenses:', error);
            expenses = [];
        }
    }

    function saveExpenses() {
        if (!currentUser) return;
        localStorage.setItem(`expenses_${currentUser.username}`, JSON.stringify(expenses));
    }

    function renderExpenses() {
        elements.expensesTableBody.innerHTML = '';
        
        if (expenses.length === 0) {
            elements.noExpensesDiv.style.display = 'block';
            renderSummary();
            return;
        }
        
        elements.noExpensesDiv.style.display = 'none';
        
        expenses.forEach((expense, index) => {
            const tr = document.createElement('tr');
            tr.className = 'fade-in';
            tr.innerHTML = `
                <td>Tk ${parseFloat(expense.amount).toFixed(2)}</td>
                <td><i class="fas fa-tag"></i> ${expense.category}</td>
                <td><i class="fas fa-calendar"></i> ${formatDate(expense.date)}</td>
                <td>${expense.description || '-'}</td>
                <td>
                    <button class="delete-btn" data-idx="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
                <td><i class="fas fa-user"></i> ${expense.username}</td>
            `;
            elements.expensesTableBody.appendChild(tr);
        });

        renderSummary();
    }

    function renderSummary() {
        if (!currentUser) return;

        // Calculate totals
        const monthlyTotals = {};
        const categoryTotals = {};
        let totalAmount = 0;

        expenses.forEach(exp => {
            const amount = parseFloat(exp.amount);
            totalAmount += amount;
            
            const monthKey = exp.date.substring(0, 7); // YYYY-MM
            monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + amount;
            
            categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + amount;
        });

        // Render monthly summary
        let monthlyHtml = `
            <div class="summary-total">Total Expenses: Tk ${totalAmount.toFixed(2)}</div>
            <ul class="summary-list">
                ${Object.entries(monthlyTotals)
                    .sort((a, b) => b[0].localeCompare(a[0]))
                    .map(([month, amount]) => 
                        `<li>${formatMonth(month)}: Tk ${amount.toFixed(2)}</li>`
                    ).join('')}
            </ul>`;
        elements.monthlySummary.innerHTML = monthlyHtml;

        // Render category summary
        let categoryHtml = `
            <ul class="summary-list">
                ${Object.entries(categoryTotals)
                    .sort((a, b) => b[1] - a[1])
                    .map(([category, amount]) => 
                        `<li>${category}: Tk ${amount.toFixed(2)}</li>`
                    ).join('')}
            </ul>`;
        elements.individualSummary.innerHTML = categoryHtml;
    }

    // Utility Functions
    function setTodayDate() {
        document.querySelectorAll('.date').forEach(input => {
            input.valueAsDate = new Date();
        });
    }

    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    function formatMonth(monthStr) {
        const [year, month] = monthStr.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
    }

    // Initialize the app
    initializeApp();
});
