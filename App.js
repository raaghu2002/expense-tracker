// App.js
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { db, getAllMembers } = require('./db');  // Import db and getAllMembers from db.js

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Set EJS as the template engine
app.set('view engine', 'ejs');

// Serve static files (e.g., CSS)
app.use(express.static(path.join(__dirname, 'public')));

// Home page
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/calculator', (req, res) => {
    res.render('calculator');
});


// Add Expense Form page
app.get('/add-expense', (req, res) => {
    // Fetch members from the database
    getAllMembers((err, members) => {
        if (err) {
            res.status(500).send({ error: 'Failed to fetch members' });
        } else {
            res.render('add-expense', { members: members });  // Pass members to EJS
        }
    });
});

// Handle form submission and add a new expense
app.post('/add-expense', (req, res) => {
    const { member, category, amount, date } = req.body;

    db.run(
        `INSERT INTO expenses (member, category, amount, date) VALUES (?, ?, ?, ?)`,
        [member, category, amount, date],
        function (err) {
            if (err) {
                res.status(500).send({ error: 'Failed to insert data' });
            } else {
                res.redirect('/dashboard'); // Redirect to dashboard after successful insert
            }
        }
    );
});

// Dashboard page
app.get('/dashboard', (req, res) => {
    // Fetch all expenses from the database
    db.all("SELECT * FROM expenses", (err, rows) => {
        if (err) {
            res.status(500).send({ error: 'Failed to fetch expenses' });
        } else {
            // Calculate the total amount of all expenses
            const totalAmount = rows.reduce((sum, expense) => sum + expense.amount, 0);

            // Fetch all members from the database (assuming you have a members table)
            db.all("SELECT * FROM members", (err, members) => {
                if (err) {
                    res.status(500).send({ error: 'Failed to fetch members' });
                } else {
                    // Calculate the amount each member should contribute (equal share)
                    const perMemberAmount = totalAmount / members.length;

                    // Initialize an array to hold the spent amounts for each member
                    const membersBalance = members.map(member => {
                        // Calculate the total amount spent by this member
                        const memberSpent = rows
                            .filter(expense => expense.member === member.name)
                            .reduce((sum, expense) => sum + expense.amount, 0);

                        // Calculate how much this member needs to pay or is owed
                        const balance = memberSpent - perMemberAmount;  // Positive means they spent more, negative means less

                        return {
                            name: member.name,
                            spent: memberSpent,
                            balance: balance.toFixed(2),  // Balance: Positive means they need to receive money, negative means they need to pay
                        };
                    });

                    // Calculate the total amounts owed or needed by other members
                    const positiveBalances = membersBalance.filter(member => member.balance > 0); // Members who need to receive money
                    const negativeBalances = membersBalance.filter(member => member.balance < 0); // Members who need to pay more

                    // Render the dashboard page with expenses, members' balances, totalAmount, and perMemberAmount
                    res.render('dashboard', {
                        expenses: rows,
                        membersBalance,
                        totalAmount,           // Pass the total amount to EJS
                        perMemberAmount,       // Pass the per member amount to EJS
                        positiveBalances,      // Members who need to be paid
                        negativeBalances,      // Members who owe money
                    });
                }
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

// Start the server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
