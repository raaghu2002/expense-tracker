// App.js
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { db } = require('./db');  // Import db from db.js

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Set EJS as the template engine
app.set('view engine', 'ejs');

// Serve static files (e.g., CSS)
app.use(express.static(path.join(__dirname, 'public')));

// Fixed members
const fixedMembers = ["Raaghu", "Likith", "Sachin", "Ankith", "Nithin"];

// Login POST route
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username === 'friends' && password === 'friends') {
        res.redirect('/index'); // Redirect to index.ejs
    } else {
        res.send('<h1>Invalid username or password!</h1><a href="/login">Go back</a>');
    }
});

// Route to render index.ejs
app.get('/index', (req, res) => {
    res.render('index'); // Make sure index.ejs exists in the views folder
});

// Route to render login.ejs
app.get('/login', (req, res) => {
    res.render('login');
});
app.get('/', (req, res) => {
    res.redirect('/login');
});



// Calculator page
app.get('/calculator', (req, res) => {
    res.render('calculator');
});

// Add Expense Form page
app.get('/add-expense', (req, res) => {
    res.render('add-expense', { members: fixedMembers });  // Pass fixed members to EJS
});

// Handle form submission and add a new expense
// Handle form submission and add a new expense
app.post('/add-expense', (req, res) => {
    const { date, category, amount, paidBy, members } = req.body;

    // Parse the total expense amount
    const totalAmount = parseFloat(amount);

    // Ensure selected members are an array and that they are unique
    const selectedMembers = members || [];

    // Calculate the per-member share based on included members
    const perMemberAmount = selectedMembers.length > 0 ? totalAmount / selectedMembers.length : 0;

    // Store the expense in the database
    db.run(`INSERT INTO expenses (date, category, amount, paid_by, included_members) VALUES (?, ?, ?, ?, ?)`,
        [date, category, totalAmount, paidBy, selectedMembers.join(', ')], function (err) {
            if (err) {
                return res.status(500).send('Error adding expense');
            }

            // After saving the expense, update the balances for each selected member
            selectedMembers.forEach(member => {
                // Example: Update member's balance (you can implement your own logic here)
            });

            res.redirect('/dashboard');
        });
});

// Dashboard page
app.get('/dashboard', (req, res) => {
    // Fetch all expenses from the database
    db.all("SELECT * FROM expenses", (err, rows) => {
        if (err) {
            console.error('Database Fetch Error:', err.message);
            return res.status(500).send({ error: 'Failed to fetch expenses' });
        } else {
            // Fixed members (replace with dynamic members if needed)
            const fixedMembers = ['Raaghu', 'Sachin', 'Nithin', 'Likith', 'Ankith'];

            // Calculate the total amount of all expenses
            const totalAmount = rows.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);

            // Calculate balances for each member
            const membersBalance = fixedMembers.map(member => {
                // Calculate total spent by this member (paid_by refers to the payer of each expense)
                const totalSpentByMember = rows
                    .filter(expense => expense.paid_by === member)
                    .reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);

                // Calculate the balance per expense based on included members
                let balance = 0;

                rows.forEach(expense => {
                    const includedMembers = expense.included_members.split(', ');
                    const perMemberAmount = expense.amount / includedMembers.length;

                    if (includedMembers.includes(member)) {
                        // If the member is in the included members, adjust their balance
                        balance += perMemberAmount;
                    }
                });

                // Final balance: What they paid minus their calculated share
                const finalBalance = totalSpentByMember - balance;

                return {
                    name: member,
                    spent: totalSpentByMember.toFixed(2),
                    balance: finalBalance.toFixed(2), // Positive balance means overpaid, negative means underpaid
                };
            });

            // Separate balances into those who owe and those owed
            const positiveBalances = membersBalance.filter(member => parseFloat(member.balance) > 0); // Members owed money
            const negativeBalances = membersBalance.filter(member => parseFloat(member.balance) < 0); // Members who owe money

            // Render the dashboard page with data
            res.render('dashboard', {
                expenses: rows,                   // Send the expense data
                membersBalance: membersBalance,   // Send the member balances
                totalAmount: totalAmount.toFixed(2), // Send the total amount formatted
                positiveBalances: positiveBalances, // Send members who are owed money
                negativeBalances: negativeBalances, // Send members who owe money
            });
        }
    });
});



// Delete an expense by ID
app.post('/delete-expense/:id', (req, res) => {
    const expenseId = req.params.id;

    db.run(`DELETE FROM expenses WHERE id = ?`, [expenseId], function (err) {
        if (err) {
            res.status(500).send({ error: 'Failed to delete expense' });
        } else {
            res.redirect('/dashboard');  // Redirect back to the dashboard after deletion
        }
    });
});

const port = process.env.PORT || 3000;
// Start the server
app.listen(port, () => {
    console.log('Server running on http://localhost:3000');
});
