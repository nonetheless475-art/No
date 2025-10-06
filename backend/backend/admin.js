const express = require('express');
const router = express.Router();
const { MongoClient, ObjectId } = require('mongodb');

// DB connect
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'trading_demo';
let usersCollection;

MongoClient.connect(MONGO_URI, { useUnifiedTopology: true })
  .then(client => {
    const db = client.db(DB_NAME);
    usersCollection = db.collection('users');
  })
  .catch(err => console.error('Admin mongo error', err));

// Get all pending withdrawals
router.get('/pending-withdrawals', async (req, res) => {
  const users = await usersCollection.find({ "transactions.type": "withdraw" }).toArray();
  // filter those with pending status
  const list = [];
  users.forEach(u => {
    u.transactions.forEach(tx => {
      if (tx.type === 'withdraw' && tx.status === 'pending') {
        list.push({ userId: u._id, username: u.username, txn: tx });
      }
    });
  });
  res.json({ success: true, pending: list });
});

// Approve withdrawal
router.post('/approve-withdraw', async (req, res) => {
  const { userId, txnTime } = req.body;
  const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
  if (!user) return res.status(400).json({ error: 'User not found' });
  // find matching txn by time
  const newTxns = user.transactions.map(tx => {
    if (tx.type === 'withdraw' && new Date(tx.time).getTime() === new Date(txnTime).getTime()) {
      // set to completed and reduce balance
      return { ...tx, status: 'completed' };
    }
    return tx;
  });
  // compute new balance (subtract amount)
  // This is naive; in real you should check status etc.
  const withdraws = user.transactions.filter(tx => tx.type === 'withdraw' && tx.status === 'pending');
  // find this one
  const target = withdraws.find(tx => new Date(tx.time).getTime() === new Date(txnTime).getTime());
  let newBalance = user.balance;
  if (target) {
    newBalance = user.balance - target.amount;
  }
  await usersCollection.updateOne(
    { _id: user._id },
    { $set: { balance: newBalance, transactions: newTxns } }
  );
  res.json({ success: true, message: 'Withdrawal approved', newBalance });
});

module.exports = router;
