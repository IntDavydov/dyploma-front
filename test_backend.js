const http = require('http');
const req = http.request('http://localhost:3001/api/portfolio', {
  method: 'GET',
  headers: { 'Authorization': `Bearer ${process.env.TOKEN || ''}` }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(data));
});
req.on('error', (e) => console.error(e));
req.end();
