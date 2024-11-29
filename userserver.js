// AppUser.js
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { db } = require('./db'); // Import db from db.js

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Set EJS as the template engine
app.set('view engine', 'ejs');

// Serve static files (e.g., CSS)
app.use(express.static(path.join(__dirname, 'public')));

// Login POST route
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username === 'friend' && password === 'friend') {
        res.redirect('/dashboard-user'); // Redirect to index.ejs
    } else {
        res.send('<h1>Invalid username or password!</h1><a href="/login">Go back</a>');
    }
});



// Route to render login.ejs
app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/', (req, res) => {
    res.redirect('/login');
});

// Dashboard page (view-only)
app.get('/dashboard-user', (req, res) => {
    // Fetch all expenses from the database
    db.all("SELECT * FROM expenses", (err, rows) => {
        if (err) {
            console.error('Database Fetch Error:', err.message);
            return res.status(500).send({ error: 'Failed to fetch expenses' });
        } else {
            const fixedMembers = ['Raaghu', 'Sachin', 'Nithin', 'Likith', 'Ankith'];

            const totalAmount = rows.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);

            const membersBalance = fixedMembers.map(member => {
                const totalSpentByMember = rows
                    .filter(expense => expense.paid_by === member)
                    .reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);

                let balance = 0;

                rows.forEach(expense => {
                    const includedMembers = expense.included_members.split(', ');
                    const perMemberAmount = expense.amount / includedMembers.length;

                    if (includedMembers.includes(member)) {
                        balance += perMemberAmount;
                    }
                });

                const finalBalance = totalSpentByMember - balance;

                return {
                    name: member,
                    spent: totalSpentByMember.toFixed(2),
                    balance: finalBalance.toFixed(2),
                };
            });

            const positiveBalances = membersBalance.filter(member => parseFloat(member.balance) > 0);
            const negativeBalances = membersBalance.filter(member => parseFloat(member.balance) < 0);

            res.render('dashboard-user', {
                expenses: rows,
                membersBalance: membersBalance,
                totalAmount: totalAmount.toFixed(2),
                positiveBalances: positiveBalances,
                negativeBalances: negativeBalances,
            });
        }
    });
});

const port = process.env.PORT || 4000;
// Start the user-specific server
app.listen(port, () => {
    console.log('User-specific server running on http://localhost:4000');
});
