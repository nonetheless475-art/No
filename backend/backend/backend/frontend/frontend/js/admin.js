async function loadPending() {
  const resp = await fetch('http://YOUR_BACKEND_URL/api/admin/pending-withdrawals');
  const data = await resp.json();
  const container = document.getElementById('pendings');
  if (!data.success) {
    container.innerText = 'Error loading';
    return;
  }
  data.pending.forEach(item => {
    const div = document.createElement('div');
    div.innerHTML = `
      User: ${item.username} 
      Amount: ${item.txn.amount} 
      Method: ${item.txn.method} 
      <button data-user="${item.userId}" data-time="${item.txn.time}">Approve</button>
    `;
    container.appendChild(div);
  });
  container.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', async () => {
      const userId = btn.getAttribute('data-user');
      const time = btn.getAttribute('data-time');
      await fetch('http://YOUR_BACKEND_URL/api/admin/approve-withdraw', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ userId, txnTime: time })
      });
      alert('Approved');
      container.innerHTML = '';
      loadPending();
    });
  });
}

loadPending();
