// Clear all existing data to start fresh
localStorage.clear();

// Expense Management Variables
let expenses = [];

// DOM Elements for expense management
const expenseForm = document.getElementById('expense-form');
const tableBody = document.querySelector('#expenses-table tbody');
const noExpensesDiv = document.getElementById('no-expenses');
const multiItemsDiv = document.getElementById('multi-items');

// Get current user data
function getCurrentUser() {
    const userData = localStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
}

// User management
function getUserData() {
  try {
    const data = localStorage.getItem('users');
    if (!data) return {};
    return JSON.parse(data);
  } catch (e) {
    console.error('Error loading user data:', e);
    return {};
  }
}

function setUserData(users) {
  try {
    localStorage.setItem('users', JSON.stringify(users));
    return true;
  } catch (e) {
    console.error('Error saving user data:', e);
    return false;
  }
}

function showLoginError(msg) {
  const errorDiv = document.getElementById('login-error');
  errorDiv.textContent = msg;
  if (msg) {
    errorDiv.style.opacity = '1';
  } else {
    errorDiv.style.opacity = '0';
  }
}

function validateUsername(username) {
  return username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);
}

function validatePassword(password) {
  return password.length >= 6;
}

// Tab switching
const showSigninBtn = document.getElementById('show-signin');
const showSignupBtn = document.getElementById('show-signup');
const signinFields = document.getElementById('signin-fields');
const signupFields = document.getElementById('signup-fields');nt.querySelector('#expenses-table tbody');
const noExpensesDiv = document.getElementById('no-expenses');

// User management
const currentUserSpan = document.getElementById('current-user');
const mainAppDiv = document.getElementById('main-app');
const loginForm = document.getElementById('login-form');

let currentUser = '';
let expenses = [];

function getStorageKey() {
  return 'expenses_' + currentUser;
}

function loadExpenses() {
  // Load all users' expenses from localStorage
  expenses = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('expenses_')) {
      const userExpenses = JSON.parse(localStorage.getItem(key) || '[]');
      expenses = expenses.concat(userExpenses);
    }
  }
}

function saveExpenses() {
  // Save only current user's expenses
  const userExpenses = expenses.filter(e => e.username === currentUser);
  localStorage.setItem(getStorageKey(), JSON.stringify(userExpenses));
}

function renderExpenses() {
  tableBody.innerHTML = '';
  if (expenses.length === 0) {
    noExpensesDiv.style.display = 'block';
    renderMonthlyAndIndividualSummary();
    return;
  } else {
    noExpensesDiv.style.display = 'none';
  }
  expenses.forEach((exp, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>Tk ${parseFloat(exp.amount).toFixed(2)}</td>
      <td>${exp.category}</td>
      <td>${exp.date}</td>
      <td>${exp.description || ''}</td>
      <td class="delete"><button class="delete-btn" data-idx="${idx}">Delete</button></td>
    `;
    // Show username who added/updated this expense
    if (exp.username) {
      const userTd = document.createElement('td');
      userTd.textContent = exp.username;
      userTd.style.fontSize = '0.95em';
      userTd.style.color = '#2d3a4a';
      tr.appendChild(userTd);
    }
    tableBody.appendChild(tr);
  });
  renderMonthlyAndIndividualSummary();
}

function setUser(user) {
  currentUser = user;
  
  if (user) {
    // Verify user exists in userData
    const users = getUserData();
    if (!users[user]) {
      console.error('Invalid user session');
      setUser(''); // Clear invalid session
      return;
    }

    // Update display name
    currentUserSpan.textContent = `Welcome, ${users[user].fullname}`;
    
    // Clear any login form values for security
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    
    // Show main app and hide login
    mainAppDiv.style.display = '';
    document.querySelector('.login-section').style.display = 'none';
    
    // Load and render data
    loadExpenses();
    setTodayDate();
    renderExpenses();
    
    // Store user session with timestamp
    const session = {
      username: user,
      loginTime: new Date().toISOString(),
      fullname: users[user].fullname
    };
    localStorage.setItem('currentUser', JSON.stringify(session));
  } else {
    // Clear sensitive data
    expenses = [];
    currentUser = '';
    currentUserSpan.textContent = '';
    
    // Show login and hide main app
    mainAppDiv.style.display = 'none';
    document.querySelector('.login-section').style.display = '';
    
    // Remove current user from localStorage
    localStorage.removeItem('currentUser');
  }
}

// User management with signup/signin
function getUserData() {
  return JSON.parse(localStorage.getItem('users') || '{}');
}
function setUserData(users) {
  localStorage.setItem('users', JSON.stringify(users));
}
function showLoginError(msg) {
  document.getElementById('login-error').textContent = msg;
}
// Tab switching
const showSigninBtn = document.getElementById('show-signin');
const showSignupBtn = document.getElementById('show-signup');
const signinFields = document.getElementById('signin-fields');
const signupFields = document.getElementById('signup-fields');
showSigninBtn.onclick = function() {
  showSigninBtn.classList.add('active');
  showSignupBtn.classList.remove('active');
  signinFields.style.display = '';
  signupFields.style.display = 'none';
  showLoginError('');
};
showSignupBtn.onclick = function() {
  showSignupBtn.classList.add('active');
  showSigninBtn.classList.remove('active');
  signinFields.style.display = 'none';
  signupFields.style.display = '';
  showLoginError('');
};
// Signup logic
const signupBtn = document.getElementById('user-signup-btn');
signupBtn.onclick = function() {
  const fullname = document.getElementById('signup-fullname').value.trim();
  const username = document.getElementById('signup-username').value.trim();
  const password = document.getElementById('signup-password').value;

  // Clear previous error
  showLoginError('');

  // Validate all fields
  if (!fullname || !username || !password) {
    showLoginError('Please fill all fields.');
    return;
  }

  // Validate username format
  if (!validateUsername(username)) {
    showLoginError('Username must be at least 3 characters long and contain only letters, numbers, and underscores.');
    return;
  }

  // Validate password
  if (!validatePassword(password)) {
    showLoginError('Password must be at least 6 characters long.');
    return;
  }

  // Get existing users or initialize empty object
  let users = getUserData();
  if (users[username]) {
    showLoginError('Username already exists. Please choose another.');
    return;
  }

  // Add new user
  users[username] = {
    fullname: fullname,
    password: password,
    createdAt: new Date().toISOString()
  };

  // Save to localStorage
  if (setUserData(users)) {
    document.getElementById('signup-fullname').value = '';
    document.getElementById('signup-username').value = '';
    document.getElementById('signup-password').value = '';
    showLoginError('✓ Signup successful! Please sign in with your new account.');
    setTimeout(() => {
      showSigninBtn.click(); // Switch to sign in tab
    }, 1500);
  } else {
    showLoginError('Error creating account. Please try again.');
  }
};

// Signin logic
loginForm.onsubmit = function(e) {
  e.preventDefault();
  
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  
  // Clear previous error
  showLoginError('');

  // Validate input
  if (!username || !password) {
    showLoginError('Please enter both username and password.');
    return;
  }

  const users = getUserData();
  
  // Check if user exists
  if (!users[username]) {
    showLoginError('Account not found. Please check your username.');
    return;
  }

  // Verify password
  if (users[username].password !== password) {
    showLoginError('Incorrect password. Please try again.');
    return;
  }

  // Login successful
  showLoginError('✓ Login successful!');
  
  // Set user session
  setUser(username);
};

// On form reset, hide all except first
form.addEventListener('reset', function() {
  setTodayDate(); // Reset date to today after form reset
});
// Handle form submission to add new expense
form.addEventListener('submit', function(e) {
  e.preventDefault();
  if (!currentUser) return;
  const rows = multiItemsDiv.querySelectorAll('.expense-row');
  let added = false;
  rows.forEach(row => {
    const amount = row.querySelector('.amount').value.trim();
    const category = row.querySelector('.category').value;
    const date = row.querySelector('.date').value;
    const description = row.querySelector('.description').value.trim();
    // Only add if at least amount, category, and date are filled
    if (!amount && !category && !date && !description) return; // skip empty row
    if (!amount || !category || !date) return; // skip incomplete row
    const expense = { amount, category, date, description, username: currentUser };
    expenses.unshift(expense);
    added = true;
  });
  if (added) {
    saveExpenses();
    renderExpenses();
    // Reset all rows and add a single empty row
    multiItemsDiv.innerHTML = '';
    const row = document.createElement('div');
    row.className = 'expense-row';
    row.innerHTML = `
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
    `;
    multiItemsDiv.appendChild(row);
  } else {
    alert('Please fill at least one complete row to add expenses.');
  }
});

// Handle delete button click
// Only one event listener for tableBody
// (event delegation)
tableBody.addEventListener('click', function(e) {
  if (!currentUser) return;
  if (e.target.classList.contains('delete-btn')) {
    const idx = e.target.getAttribute('data-idx');
    expenses.splice(idx, 1);
    saveExpenses();
    renderExpenses();
  }
});

// Set date input default to today
function setTodayDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  dateInput.value = `${yyyy}-${mm}-${dd}`;
}

// Check for existing session on page load
try {
  const savedSession = localStorage.getItem('currentUser');
  if (savedSession) {
    const session = JSON.parse(savedSession);
    const users = getUserData();
    
    // Verify if the user still exists in users data
    if (users[session.username]) {
      setUser(session.username);
    } else {
      console.log('Session user not found in users data');
      localStorage.removeItem('currentUser');
      setUser('');
    }
  } else {
    setUser('');
  }
} catch (error) {
  console.error('Error loading user session:', error);
  localStorage.removeItem('currentUser');
  setUser('');
}

// Add logout functionality
const logoutBtn = document.createElement('button');
logoutBtn.textContent = 'Logout';
logoutBtn.className = 'nav-btn';
logoutBtn.onclick = function() {
  if (confirm('Are you sure you want to logout?')) {
    setUser('');
  }
};
document.querySelector('.user-info').appendChild(logoutBtn);

// Add: Monthly and individual expense summary elements
const summarySection = document.createElement('section');
summarySection.id = 'summary-section';
summarySection.innerHTML = `
  <h2>Monthly & Individual Expenses</h2>
  <div id="monthly-summary" style="margin-bottom: 1rem;"></div>
  <div id="individual-summary"></div>
`;
mainAppDiv.insertBefore(summarySection, mainAppDiv.children[1]);

function getMonthKey(dateStr) {
  const d = new Date(dateStr);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

function renderMonthlyAndIndividualSummary() {
  // Monthly summary (sum for all users)
  const monthly = {};
  const individual = {};
  expenses.forEach(exp => {
    const month = getMonthKey(exp.date);
    monthly[month] = (monthly[month] || 0) + parseFloat(exp.amount);
    if (exp.username) {
      individual[exp.username] = (individual[exp.username] || 0) + parseFloat(exp.amount);
    }
  });
  // Monthly (sum for all users)
  let monthlyHtml = '<b>Monthly Expenses (All Users):</b><ul style="margin:0; padding-left:1.2em">';
  for (const m in monthly) {
    monthlyHtml += `<li>${m}: Tk ${monthly[m].toFixed(2)}</li>`;
  }
  monthlyHtml += '</ul>';
  document.getElementById('monthly-summary').innerHTML = monthlyHtml;
  // Individual
  let individualHtml = '<b>Individual Expenses:</b><ul style="margin:0; padding-left:1.2em">';
  for (const u in individual) {
    individualHtml += `<li>${u}: Tk ${individual[u].toFixed(2)}</li>`;
  }
  individualHtml += '</ul>';
  document.getElementById('individual-summary').innerHTML = individualHtml;
}

// Multi-item add logic
const multiItemsDiv = document.getElementById('multi-items');
const addItemBtn = document.getElementById('add-item-btn');

addItemBtn.addEventListener('click', function() {
  const row = document.createElement('div');
  row.className = 'expense-row';
  row.innerHTML = `
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
    <button type="button" class="remove-item-btn" style="background:#e74c3c;color:#fff;border:none;border-radius:4px;padding:0.2rem 0.6rem;margin-left:4px;">Remove</button>
  `;
  multiItemsDiv.appendChild(row);
  row.querySelector('.remove-item-btn').onclick = function() {
    row.remove();
  };
});
