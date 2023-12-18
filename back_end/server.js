const express = require('express');
const axios = require('axios');
const WebSocket = require('ws');
const fs = require('fs');

const app = express();
const server = app.listen(3001, () => console.log('Server running on port 3001'));

const wss = new WebSocket.Server({ server });

const stocksFile = 'stocks.json';

async function fetchTopStocks() {
  const response = await axios.get(`https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/gainers?apiKey=${process.env.POLYGON_API_KEY}`);
  return response.data.tickerSymbols.slice(0, 20);
}

async function updateStockPrices() {
  const stocks = await fetchTopStocks();
  const data = stocks.map(stock => ({
    id: stock.ticker,
    openPrice: stock.open,
    refreshInterval: Math.floor(Math.random() * 5) + 1,
    currentPrice: stock.open
  }));

  fs.writeFileSync(stocksFile, JSON.stringify(data));

  setInterval(async () => {
    const stocksData = JSON.parse(fs.readFileSync(stocksFile));
    stocksData.forEach(stock => {
      stock.currentPrice = stock.currentPrice + (Math.random() - 0.5); 
      wss.clients.forEach(client => {
        client.send(JSON.stringify({ id: stock.id, price: stock.currentPrice }));
      });
    });
    fs.writeFileSync(stocksFile, JSON.stringify(stocksData));
  }, 1000); 
}

updateStockPrices();

wss.on('connection', ws => {
  ws.on('message', message => {
    console.log(`Received message: ${message}`);
  });
});


app.get('/api/stocks/:n', (req, res) => {
  const n = Math.min(parseInt(req.params.n), 20);
  const stocksData = JSON.parse(fs.readFileSync(stocksFile));
  res.json(stocksData.slice(0, n));
});