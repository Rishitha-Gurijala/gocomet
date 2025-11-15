const db = require('./mysqldb');

// simple query
db.query('SELECT 1 + 1 AS result', (err, rows) => {
  if (err) throw err;
  console.log('Result:', rows[0].result);
});
