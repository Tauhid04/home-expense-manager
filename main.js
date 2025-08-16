// Initialize the application when DOM is fully loaded
document.addEventListener("DOMContentLoaded", function() {
    // DOM Elements
    const elements = {
        mainApp: document.getElementById("main-app"),
        loginSection: document.querySelector(".login-section"),
        loginForm: document.getElementById("login-form"),
        signupForm: document.getElementById("signup-form"),
        loginError: document.getElementById("login-error"),
        currentUserSpan: document.getElementById("current-user"),
        expenseForm: document.getElementById("expense-form"),
        multiItemsDiv: document.getElementById("multi-items"),
        expensesTableBody: document.getElementById("expenses-table-body"),
        noExpensesDiv: document.getElementById("no-expenses"),
        monthlySummary: document.getElementById("monthly-summary"),
        individualSummary: document.getElementById("individual-summary"),
        logoutBtn: document.getElementById("logout-btn")
    };

    // App State
    let currentUser = null;
    let expenses = [];
    let allExpenses = [];

    // Load all users' expenses from localStorage
    function loadAllExpenses() {
        const users = JSON.parse(localStorage.getItem("users") || "{}");
        allExpenses = [];
        
        // Collect expenses from all users
        Object.keys(users).forEach(username => {
            const userExpenses = JSON.parse(localStorage.getItem(`expenses_${username}`) || "[]");
            // Ensure amounts are numbers
            const validatedExpenses = userExpenses.map(expense => ({
                ...expense,
                amount: Number(expense.amount)
            }));
            allExpenses = [...allExpenses, ...validatedExpenses];
        });

        // Sort by date
        allExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // Load current user's expenses from localStorage
    function loadExpenses() {
        const savedExpenses = localStorage.getItem(`expenses_${currentUser.username}`);
        if (savedExpenses) {
            try {
                const parsed = JSON.parse(savedExpenses);
                // Ensure amounts are numbers
                expenses = parsed.map(expense => ({
                    ...expense,
                    amount: Number(expense.amount)
                }));
            } catch (e) {
                expenses = [];
                console.error("Error loading expenses:", e);
            }
        } else {
            expenses = [];
        }
        loadAllExpenses(); // Also load all expenses
    }

    // Save expenses to localStorage
    function saveExpenses() {
        // Ensure amounts are numbers before saving
        const validatedExpenses = expenses.map(expense => ({
            ...expense,
            amount: Number(expense.amount)
        }));
        
        // Save the current user's expenses
        localStorage.setItem(`expenses_${currentUser.username}`, JSON.stringify(validatedExpenses));
        // Reload all expenses to update the view
        loadAllExpenses();
        // Update the summaries
        updateSummaries();
    }

    // Update summary sections
    function updateSummaries() {
        try {
            // Monthly summary - show total of all users
            const monthlyTotal = allExpenses.reduce((total, exp) => total + Number(exp.amount), 0);
            const personalTotal = expenses.reduce((total, exp) => total + Number(exp.amount), 0);

            elements.monthlySummary.innerHTML = `
                <p><strong>Total Household Expenses:</strong> ${monthlyTotal.toFixed(2)}</p>
                <p><strong>Your Total Expenses:</strong> ${personalTotal.toFixed(2)}</p>
                <p><strong>Your Contribution:</strong> ${monthlyTotal ? ((personalTotal / monthlyTotal) * 100).toFixed(1) : 0}%</p>
            `;

            // Category summary - group by category for all users
            const categoryTotals = allExpenses.reduce((totals, exp) => {
                totals[exp.category] = (totals[exp.category] || 0) + Number(exp.amount);
                return totals;
            }, {});

            const userTotals = allExpenses.reduce((totals, exp) => {
                totals[exp.user] = (totals[exp.user] || 0) + Number(exp.amount);
                return totals;
            }, {});

            elements.individualSummary.innerHTML = `
                <div class="summary-section">
                    <h4>By Category:</h4>
                    ${Object.entries(categoryTotals)
                        .map(([category, total]) => `
                            <p><strong>${category}:</strong> ${Number(total).toFixed(2)}</p>
                        `).join("")}
                </div>
                <div class="summary-section">
                    <h4>By User:</h4>
                    ${Object.entries(userTotals)
                        .map(([user, total]) => `
                            <p><strong>${user}:</strong> ${Number(total).toFixed(2)} 
                               (${monthlyTotal ? ((Number(total) / monthlyTotal) * 100).toFixed(1) : 0}%)</p>
                        `).join("")}
                </div>
            `;
        } catch (e) {
            console.error("Error updating summaries:", e);
        }
    }

    // Render expenses in the table
    function renderExpenses() {
        if (!allExpenses.length) {
            elements.expensesTableBody.innerHTML = "";
            elements.noExpensesDiv.style.display = "block";
            updateSummaries();
            return;
        }

        elements.noExpensesDiv.style.display = "none";
        try {
            elements.expensesTableBody.innerHTML = allExpenses
                .map((expense, index) => `
                    <tr>
                        <td>${Number(expense.amount).toFixed(2)}</td>
                        <td><i class="fas fa-tag"></i> ${expense.category}</td>
                        <td>${new Date(expense.date).toLocaleDateString()}</td>
                        <td>${expense.description || "-"}</td>
                        <td>
                            ${expense.user === currentUser.fullname ? 
                                `<button onclick="deleteExpense(${index})" class="delete-btn">
                                    <i class="fas fa-trash"></i>
                                </button>` : 
                                '-'}
                        </td>
                        <td>${expense.user}</td>
                    </tr>
                `).join("");
        } catch (e) {
            console.error("Error rendering expenses:", e);
            elements.expensesTableBody.innerHTML = "";
            elements.noExpensesDiv.style.display = "block";
        }
        
        updateSummaries();
    }

    // UI Functions
    function showMessage(message, isError = true) {
        elements.loginError.textContent = message;
        elements.loginError.className = isError ? "error" : "success";
    }

    function switchTab(tab) {
        const isSignIn = tab === "signin";
        document.getElementById("show-signin").classList.toggle("active", isSignIn);
        document.getElementById("show-signup").classList.toggle("active", !isSignIn);
        elements.loginForm.style.display = isSignIn ? "block" : "none";
        elements.signupForm.style.display = isSignIn ? "none" : "block";
        showMessage("");
    }

    function showMainApp() {
        elements.mainApp.style.display = "block";
        elements.loginSection.style.display = "none";
        loadExpenses();
        renderExpenses();
    }

    function showLoginPage() {
        elements.mainApp.style.display = "none";
        elements.loginSection.style.display = "block";
        expenses = [];
        allExpenses = [];
        currentUser = null;
        localStorage.removeItem("currentUser");
    }

    // User Management
    elements.signupForm.onsubmit = function(e) {
        e.preventDefault();
        const fullname = document.getElementById("signup-fullname").value.trim();
        const username = document.getElementById("signup-username").value.trim().toLowerCase();
        const password = document.getElementById("signup-password").value;

        if (!fullname || !username || !password) {
            showMessage("Please fill all fields");
            return;
        }

        const users = JSON.parse(localStorage.getItem("users") || "{}");
        
        if (users[username]) {
            showMessage("Username already exists");
            return;
        }

        users[username] = { fullname, password };
        localStorage.setItem("users", JSON.stringify(users));
        showMessage(" Account created successfully!", false);

        // Clear form
        elements.signupForm.reset();

        // Switch to login
        setTimeout(() => switchTab("signin"), 1500);
    };

    // Login Handler
    elements.loginForm.onsubmit = function(e) {
        e.preventDefault();

        const username = document.getElementById("login-username").value.trim().toLowerCase();
        const password = document.getElementById("login-password").value;

        if (!username || !password) {
            showMessage("Please enter username and password");
            return;
        }

        const users = JSON.parse(localStorage.getItem("users") || "{}");
        const user = users[username];

        if (!user) {
            showMessage("User not found");
            return;
        }

        if (user.password !== password) {
            showMessage("Incorrect password");
            return;
        }

        // Store logged in user
        currentUser = { username, fullname: user.fullname };
        localStorage.setItem("currentUser", JSON.stringify(currentUser));

        showMessage(" Login successful!", false);
        elements.currentUserSpan.innerHTML = `<i class="fas fa-user"></i> ${user.fullname}`;
        
        // Clear login form
        elements.loginForm.reset();

        setTimeout(showMainApp, 1000);
    };

    // Expense Form Handler
    elements.expenseForm.onsubmit = function(e) {
        e.preventDefault();
        
        const rows = document.querySelectorAll(".expense-row");
        const newExpenses = [];
        
        rows.forEach(row => {
            const amount = row.querySelector(".amount").value;
            const category = row.querySelector(".category").value;
            const date = row.querySelector(".date").value;
            const description = row.querySelector(".description").value;
            
            if (amount && category && date) {
                newExpenses.push({
                    id: Date.now() + Math.random(),  // Add unique ID for each expense
                    amount: Number(amount),  // Ensure amount is a number
                    category,
                    date,
                    description,
                    user: currentUser.fullname,
                    username: currentUser.username  // Add username for reference
                });
            }
        });
        
        // Add new expenses to the current user's expenses
        expenses = [...expenses, ...newExpenses];
        
        // Save and update the view
        saveExpenses();
        renderExpenses();
        
        // Reset form and show only one row
        elements.expenseForm.reset();
        const rows_to_remove = document.querySelectorAll(".expense-row:not(:first-child)");
        rows_to_remove.forEach(row => row.remove());
        document.querySelector(".remove-row").style.display = "none";
    };

    // Add Another Item button handler
    document.getElementById("add-item-btn").onclick = function() {
        const template = document.querySelector(".expense-row").cloneNode(true);
        template.querySelectorAll("input").forEach(input => input.value = "");
        template.querySelector("select").value = "";
        template.querySelector(".remove-row").style.display = "inline-flex";
        elements.multiItemsDiv.appendChild(template);
        
        // Add click handler to new remove button
        template.querySelector(".remove-row").onclick = function() {
            template.remove();
        };
    };

    // Tab Switching
    document.getElementById("show-signin").onclick = () => switchTab("signin");
    document.getElementById("show-signup").onclick = () => switchTab("signup");

    // Logout Handler
    elements.logoutBtn.onclick = showLoginPage;

    // Check for existing session
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        elements.currentUserSpan.innerHTML = `<i class="fas fa-user"></i> ${currentUser.fullname}`;
        showMainApp();
    } else {
        showLoginPage();
    }

    // Delete expense handler
    window.deleteExpense = function(index) {
        const expenseToDelete = allExpenses[index];

        // Check if this expense belongs to the current user
        if (expenseToDelete.user !== currentUser.fullname) {
            alert("You can only delete your own expenses!");
            return;
        }

        if (confirm("Are you sure you want to delete this expense?")) {
            // Find and remove the expense from the user's expenses array
            expenses = expenses.filter(exp => exp.id !== expenseToDelete.id);
            saveExpenses();
            renderExpenses();
        }
    };
});
