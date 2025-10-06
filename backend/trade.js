const express = require('express');
const router = express.Router();
const { MongoClient, ObjectId } = require('mongodb');

// Connect DB (reuse or reinitialize)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'trading_demo';
let usersCollection;

MongoClient.connect(MONGO_URI, { useUnifiedTopology: true })
  .then(client => {
    const db = client.db(DB_NAME);
    usersCollection = db.collection('users');
  })
  .catch(err => console.error('Mongo trade connect error', err));

// Place trade (buy / sell) — simulation
router.post('/order', async (req, res) => {
  const { userId, pair, type, amount } = req.body;
  // type = "buy" or "sell"
  const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
  if (!user) return res.status(400).json({ error: 'User not found' });
  if (amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

  // Simulate P/L: random move
  const move = (Math.random() * 2 - 1) * 0.05; // ±5% random
  let profit = 0;
  if (type === 'buy') {
    profit = amount * move;  // if price up => positive, down => negative
  } else if (type === 'sell') {
    profit = amount * (-move);
  }

  // Ratio logic: cap profits etc (demo)
  // e.g. if profit positive, give 80% to user, 20% kept
  let userGain = 0;
  let userLoss = 0;
  if (profit > 0) {
    userGain = profit * 0.8;
  } else {
    userLoss = -profit; // full loss
  }

  // Update user balance & transactions
  const newBalance = user.balance + userGain - userLoss;
  const txn = {
    time: new Date(),
    pair,
    type,
    amount,
    profit: userGain - userLoss
  };

  await usersCollection.updateOne(
    { _id: user._id },
    { $set: { balance: newBalance },
      $push: { transactions: txn }
    }
  );
  return res.json({ success: true, newBalance, txn });
});

// Deposit (simulate)
router.post('/deposit', async (req, res) => {
  const { userId, amount, method } = req.body;
  // method: "USDT_BEP20" or "USDT_TRC20"
  const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
  if (!user) return res.status(400).json({ error: 'User not found' });
  // for demo, deposit is instant
  const newBalance = user.balance + amount;
  const txn = {
    time: new Date(),
    type: 'deposit',
    amount,
    method,
    status: 'completed'
  };
  await usersCollection.updateOne(
    { _id: user._id },
    { $push: { transactions: txn }, $set: { balance: newBalance } }
  );
  res.json({ success: true, newBalance, txn });
});

// Withdraw (simulate, needs admin approval)
router.post('/withdraw', async (req, res) => {
  const { userId, amount, method } = req.body;
  const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
  if (!user) return res.status(400).json({ error: 'User not found' });
  if (amount > user.balance) return res.status(400). json({ error: 'Insufficient balance' });

  const txn = {
    time: new Date(),
    type: 'withdraw',
    amount,
    method,
    status: 'pending'
  };
  await usersCollection.updateOne(
    { _id: user._id },
    { $push: { transactions: txn } }
  );
  res.json({ success: true, message: 'Withdrawal request pending approval', txn });
});

// Get transactions & balance
router.get('/history/:userId', async (req, res) => {
  const uid = req.params.userId;
  const user = await usersCollection.findOne({ _id: new ObjectId(uid) });
  if (!user) return res.status(400).json({ error: 'User not found' });
  return res.json({ success: true, balance: user.balance, transactions: user.transactions });
});

module.exports = router;
