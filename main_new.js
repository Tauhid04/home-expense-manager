// DOM Elements
const elements = {
    mainApp: document.getElementById('main-app'),
    loginSection: document.querySelector('.login-section'),
    loginForm: document.getElementById('login-form'),
    signupForm: document.getElementById('signup-form'),
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

// UI Functions
function showMessage(message, isError = true) {
    if (elements.loginError) {
        elements.loginError.textContent = message;
        elements.loginError.className = isError ? 'error' : 'success';
        elements.loginError.style.display = message ? 'block' : 'none';
    }
}

function switchTab(tab) {
    const isSignIn = tab === 'signin';
    const signinBtn = document.getElementById('show-signin');
    const signupBtn = document.getElementById('show-signup');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    if (signinBtn && signupBtn) {
        signinBtn.classList.toggle('active', isSignIn);
        signupBtn.classList.toggle('active', !isSignIn);
    }
    
    if (loginForm && signupForm) {
        loginForm.style.display = isSignIn ? 'block' : 'none';
        signupForm.style.display = isSignIn ? 'none' : 'block';
        
        // Reset forms
        loginForm.reset();
        signupForm.reset();
    }
    
    showMessage('');
}

function showMainApp() {
    if (elements.mainApp && elements.loginSection) {
        elements.mainApp.style.display = 'block';
        elements.loginSection.style.display = 'none';
        loadExpenses();
        renderExpenses();
        renderSummary();
    }
}

function showLoginPage() {
    if (elements.mainApp && elements.loginSection) {
        // Clear stored data
        localStorage.removeItem('currentUser');
        currentUser = null;
        expenses = [];
        
        // Update UI
        elements.mainApp.style.display = 'none';
        elements.loginSection.style.display = 'block';
        
        // Reset forms and switch to signin tab
        switchTab('signin');
        
        // Clear user display
        if (elements.currentUserSpan) {
            elements.currentUserSpan.innerHTML = '';
        }
    }
}

// User Management
function handleSignup(e) {
    e.preventDefault();
    console.log('Signup attempt...');

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

    try {
        const users = getUsers();
        console.log('Current users:', Object.keys(users));
        
        if (users[username]) {
            showMessage('Username already exists');
            return;
        }

        users[username] = { fullname, password };
        localStorage.setItem('users', JSON.stringify(users));
        console.log('User registered:', username);
        
        showMessage('✓ Account created successfully!', false);
        elements.signupForm.reset();
        
        setTimeout(() => {
            switchTab('signin');
        }, 1500);
    } catch (error) {
        console.error('Signup error:', error);
        showMessage('Error creating account. Please try again.');
    }
}

function handleLogin(e) {
    e.preventDefault();
    console.log('Login attempt...');

    const username = document.getElementById('login-username').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
        showMessage('Please enter username and password');
        return;
    }

    try {
        const users = getUsers();
        console.log('Available users:', Object.keys(users));
        const user = users[username];

        if (!user) {
            showMessage('User not found');
            return;
        }

        if (user.password !== password) {
            showMessage('Incorrect password');
            return;
        }

        currentUser = { username, fullname: user.fullname };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        showMessage('✓ Login successful!', false);
        elements.currentUserSpan.innerHTML = `<i class="fas fa-user"></i> ${user.fullname}`;
        elements.loginForm.reset();

        setTimeout(showMainApp, 1000);
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Error during login. Please try again.');
    }
}

function handleLogout() {
    if (!confirm('Are you sure you want to logout?')) return;

    try {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging out...';
            logoutBtn.disabled = true;
        }

        setTimeout(() => {
            currentUser = null;
            localStorage.removeItem('currentUser');
            expenses = [];
            showLoginPage();
            
            if (logoutBtn) {
                logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
                logoutBtn.disabled = false;
            }
        }, 500);
    } catch (error) {
        console.error('Logout error:', error);
        showMessage('Error during logout. Please try again.');
    }
}

// Data Management
function getUsers() {
    try {
        return JSON.parse(localStorage.getItem('users') || '{}');
    } catch (error) {
        console.error('Error loading users:', error);
        return {};
    }
}

// Event Listeners Setup
function setupEventListeners() {
    // Tab switching
    const signinBtn = document.getElementById('show-signin');
    const signupBtn = document.getElementById('show-signup');
    
    if (signinBtn && signupBtn) {
        signinBtn.addEventListener('click', () => switchTab('signin'));
        signupBtn.addEventListener('click', () => switchTab('signup'));
    }

    // Form submissions
    if (elements.signupForm) {
        elements.signupForm.addEventListener('submit', handleSignup);
    }
    
    if (elements.loginForm) {
        elements.loginForm.addEventListener('submit', handleLogin);
    }
    
    if (elements.expenseForm) {
        elements.expenseForm.addEventListener('submit', handleExpenseSubmit);
    }

    // Add new expense row
    const addItemBtn = document.getElementById('add-item-btn');
    if (addItemBtn) {
        addItemBtn.addEventListener('click', addExpenseRow);
    }

    // Delete expense
    if (elements.expensesTableBody) {
        elements.expensesTableBody.addEventListener('click', handleExpenseDelete);
    }

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// Initialize the application
function initializeApp() {
    // Clear any existing session
    localStorage.clear();
    currentUser = null;
    expenses = [];
    
    // Setup event listeners
    setupEventListeners();
    
    // Show login page
    showLoginPage();
    
    // Initialize expense form date
    setTodayDate();
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Rest of your existing expense management functions...
// (keep all the expense-related functions as they are)
