// after existing imports
const trade = require('./trade');
const admin = require('./admin');

app.use('/api/trade', trade);
app.use('/api/admin', admin);
