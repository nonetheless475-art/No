// After existing code in dashboard.js

async function loadHistory() {
  const resp = await fetch(`http://YOUR_BACKEND_URL/api/trade/history/${userId}`);
  const data = await resp.json();
  if (data.success) {
    document.getElementById('balanceDisplay').innerText = `Balance: ${data.balance.toFixed(2)}`;
    const list = data.transactions.map(tx => {
      return `<div>${tx.time} | ${tx.type} | ${tx.amount} | ${tx.status || ''} | Profit: ${tx.profit || 0}</div>`;
    });
    document.getElementById('historyList').innerHTML = list.join('');
  }
}
loadHistory();

document.getElementById('depositBtn').addEventListener('click', async () => {
  const amount = parseFloat(document.getElementById('depositAmount').value);
  const method = document.getElementById('depositMethod').value;
  const resp = await fetch('http://YOUR_BACKEND_URL/api/trade/deposit', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ userId, amount, method })
  });
  const data = await resp.json();
  if (data.success) {
    alert('Deposit success');
    loadHistory();
  } else {
    alert(data.error);
  }
});

document.getElementById('withdrawBtn').addEventListener('click', async () => {
  const amount = parseFloat(document.getElementById('withdrawAmount').value);
  const method = document.getElementById('withdrawMethod').value;
  const resp = await fetch('http://YOUR_BACKEND_URL/api/trade/withdraw', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ userId, amount, method })
  });
  const data = await resp.json();
  if (data.success) {
    alert('Withdrawal requested. Pending approval.');
    loadHistory();
  } else {
    alert(data.error);
  }
});
