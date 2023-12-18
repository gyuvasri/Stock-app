import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [stocks, setStocks] = useState([]);
  const [updates, setUpdates] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const response = await axios.get('http://localhost:3001/api/stocks/5'); 
      setStocks(response.data);

      const ws = new WebSocket('ws://localhost:3001');
      ws.onmessage = event => {
        const update = JSON.parse(event.data);
        setUpdates(prevUpdates => ({ ...prevUpdates, [update.id]: update.price }));
      };

      return () => {
        ws.close();
      };
    };

    fetchData();
  }, []);

  return (
    <div>
      <h1>Stocks List</h1>
      <ul>
        {stocks.map(stock => (
          <li key={stock.id}>
            {`${stock.id}: ${updates[stock.id] !== undefined ? updates[stock.id].toFixed(2) : stock.openPrice.toFixed(2)}`}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
