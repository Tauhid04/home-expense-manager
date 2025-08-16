// Clear all stored data to start fresh
localStorage.clear();

// DOM Elements
const expenseForm = document.getElementById('expense-form');
const tableBody = document.querySelector('#expenses-table tbody');
const noExpensesDiv = document.getElementById('no-expenses');
const currentUserSpan = document.getElementById('current-user');
const mainAppDiv = document.getElementById('main-app');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const multiItemsDiv = document.getElementById('multi-items');
const showSigninBtn = document.getElementById('show-signin');
const showSignupBtn = document.getElementById('show-signup');
const signinFields = document.getElementById('signin-fields');
const signupFields = document.getElementById('signup-fields');

// Global Variables
let currentUser = '';
let expenses = [];

// Basic UI Functions
function showLoginError(message, isSuccess = false) {
    const errorDiv = document.getElementById('login-error');
    errorDiv.textContent = message;
    errorDiv.style.color = isSuccess ? '#10b981' : '#ef4444';
    errorDiv.style.opacity = message ? '1' : '0';
}

function clearLoginForms() {
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('signup-fullname').value = '';
    document.getElementById('signup-username').value = '';
    document.getElementById('signup-password').value = '';
    showLoginError('');
}

// Tab Switching Logic
showSigninBtn.onclick = function() {
    showSigninBtn.classList.add('active');
    showSignupBtn.classList.remove('active');
    signinFields.style.display = '';
    signupFields.style.display = 'none';
    clearLoginForms();
};

showSignupBtn.onclick = function() {
    showSignupBtn.classList.add('active');
    showSigninBtn.classList.remove('active');
    signinFields.style.display = 'none';
    signupFields.style.display = '';
    clearLoginForms();
};

// User Management Functions
function getUserData() {
    const data = localStorage.getItem('users');
    return data ? JSON.parse(data) : {};
}

function setUserData(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

function validateUsername(username) {
    return username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);
}

function validatePassword(password) {
    return password.length >= 6;
}

// Signup Logic
document.getElementById('user-signup-btn').onclick = function() {
    const fullname = document.getElementById('signup-fullname').value.trim();
    const username = document.getElementById('signup-username').value.trim().toLowerCase();
    const password = document.getElementById('signup-password').value;

    // Validation
    if (!fullname || !username || !password) {
        showLoginError('Please fill in all fields');
        return;
    }

    if (!validateUsername(username)) {
        showLoginError('Username must be at least 3 characters and contain only letters, numbers, and underscores');
        return;
    }

    if (!validatePassword(password)) {
        showLoginError('Password must be at least 6 characters long');
        return;
    }

    const users = getUserData();
    if (users[username]) {
        showLoginError('Username already exists');
        return;
    }

    users[username] = {
        fullname,
        password,
        createdAt: new Date().toISOString()
    };

    setUserData(users);
    showLoginError('Account created successfully! Please log in.', true);
    
    setTimeout(() => {
        showSigninBtn.click();
    }, 1500);
};

// Login Logic
loginForm.onsubmit = function(e) {
    e.preventDefault();
    
    const username = document.getElementById('login-username').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;

    // Clear any previous error messages
    showLoginError('');

    if (!username || !password) {
        showLoginError('Please enter both username and password');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const user = users[username];

    if (!user) {
        showLoginError('Account not found');
        return;
    }

    if (user.password !== password) {
        showLoginError('Incorrect password');
        return;
    }

    // Update display immediately
    currentUser = username;
    currentUserSpan.textContent = `Welcome, ${user.fullname}`;
    
    // Hide login, show main app
    mainAppDiv.style.display = 'block';
    document.querySelector('.login-section').style.display = 'none';

    // Save session
    localStorage.setItem('session', JSON.stringify({
        username,
        fullname: user.fullname,
        timestamp: new Date().toISOString()
    }));

    // Clear login form
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';

    // Load and render expenses
    loadExpenses();
    setTodayDate();
    renderExpenses();
};

// Session Management
function setUser(username, fullname = '') {
    console.log('setUser called with:', { username, fullname });
    
    currentUser = username;
    
    if (username) {
        try {
            // Update display
            currentUserSpan.textContent = `Welcome, ${fullname || username}`;
            
            // Show main app
            mainAppDiv.style.display = 'block'; // Changed from '' to 'block'
            document.querySelector('.login-section').style.display = 'none';
            
            // Save session
            const session = { username, fullname, timestamp: new Date().toISOString() };
            localStorage.setItem('session', JSON.stringify(session));
            
            console.log('Main app should be visible now');
            
            // Load data
            loadExpenses();
            setTodayDate();
            renderExpenses();
            
            // Clear login forms
            document.getElementById('login-username').value = '';
            document.getElementById('login-password').value = '';
            
            console.log('User setup completed successfully');
        } catch (error) {
            console.error('Error in setUser:', error);
        }
    } else {
        // Logout
        currentUserSpan.textContent = '';
        mainAppDiv.style.display = 'none';
        document.querySelector('.login-section').style.display = 'block'; // Changed from '' to 'block'
        localStorage.removeItem('session');
        expenses = [];
        console.log('User logged out');
    }
}

// Check for existing session
const savedSession = localStorage.getItem('session');
if (savedSession) {
    try {
        const session = JSON.parse(savedSession);
        const users = getUserData();
        if (users[session.username]) {
            setUser(session.username, session.fullname);
        } else {
            localStorage.removeItem('session');
        }
    } catch (error) {
        localStorage.removeItem('session');
    }
}

// Add logout button
const userInfo = document.createElement('div');
userInfo.className = 'user-info';
userInfo.style.display = 'flex';
userInfo.style.alignItems = 'center';
userInfo.style.gap = '1rem';
userInfo.style.marginBottom = '1rem';

const logoutBtn = document.createElement('button');
logoutBtn.textContent = 'Logout';
logoutBtn.className = 'nav-btn';
logoutBtn.onclick = () => {
    if (confirm('Are you sure you want to logout?')) {
        setUser('');
        showSigninBtn.click();
    }
};

mainAppDiv.insertBefore(userInfo, mainAppDiv.firstChild);
userInfo.appendChild(currentUserSpan);
userInfo.appendChild(logoutBtn);

// Date Helper Function
function setTodayDate() {
    const dateInputs = document.querySelectorAll('.date');
    dateInputs.forEach(input => {
        input.valueAsDate = new Date();
    });
}

// The rest of your expense management code remains the same
// Expense Management Functions
function loadExpenses() {
    console.log('Loading expenses for user:', currentUser);
    if (!currentUser) return;
    
    try {
        const key = 'expenses_' + currentUser;
        const savedExpenses = localStorage.getItem(key);
        expenses = savedExpenses ? JSON.parse(savedExpenses) : [];
        console.log('Loaded expenses:', expenses);
    } catch (error) {
        console.error('Error loading expenses:', error);
        expenses = [];
    }
}

function saveExpenses() {
    console.log('Saving expenses for user:', currentUser);
    if (!currentUser) return;
    
    try {
        const key = 'expenses_' + currentUser;
        localStorage.setItem(key, JSON.stringify(expenses));
        console.log('Expenses saved successfully');
    } catch (error) {
        console.error('Error saving expenses:', error);
    }
}

function renderExpenses() {
    console.log('Rendering expenses');
    if (!currentUser) return;

    try {
        tableBody.innerHTML = '';
        
        if (expenses.length === 0) {
            noExpensesDiv.style.display = 'block';
            return;
        }
        
        noExpensesDiv.style.display = 'none';
        
        expenses.forEach((exp, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>Tk ${parseFloat(exp.amount).toFixed(2)}</td>
                <td>${exp.category}</td>
                <td>${exp.date}</td>
                <td>${exp.description || ''}</td>
                <td class="delete">
                    <button class="delete-btn" data-idx="${idx}">Delete</button>
                </td>
                <td>${exp.username || currentUser}</td>
            `;
            tableBody.appendChild(tr);
        });
        
        console.log('Expenses rendered successfully');
    } catch (error) {
        console.error('Error rendering expenses:', error);
    }
}

// Handle expense form submission
expenseForm.addEventListener('submit', function(e) {
    e.preventDefault();
    console.log('Expense form submitted');
    
    if (!currentUser) {
        console.log('No user logged in');
        return;
    }

    const rows = multiItemsDiv.querySelectorAll('.expense-row');
    let added = false;

    rows.forEach(row => {
        const amount = row.querySelector('.amount').value.trim();
        const category = row.querySelector('.category').value;
        const date = row.querySelector('.date').value;
        const description = row.querySelector('.description').value.trim();

        if (!amount || !category || !date) return;

        expenses.unshift({
            amount,
            category,
            date,
            description,
            username: currentUser
        });
        added = true;
    });

    if (added) {
        saveExpenses();
        renderExpenses();
        
        // Reset form
        multiItemsDiv.innerHTML = `
            <div class="expense-row">
                <input type="number" class="amount form-step active expense-input" placeholder="Amount (Tk)" min="0.01" step="0.01" required>
                <select class="category form-step expense-input" required>
                    <option value="" disabled selected>Category</option>
                    <option>Food</option>
                    <option>Transport</option>
                    <option>Bills</option>
                    <option>Shopping</option>
                    <option>Other</option>
                </select>
                <input type="date" class="date form-step expense-input" required>
                <input type="text" class="description form-step expense-input" placeholder="Description" maxlength="40">
            </div>
        `;
        setTodayDate();
    } else {
        alert('Please fill at least one complete row to add expenses.');
    }
});
