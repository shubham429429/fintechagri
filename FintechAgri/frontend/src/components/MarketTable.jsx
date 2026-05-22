import React from 'react';

const MarketTable = ({ data }) => {
  if (!data || data.length === 0) return <div>No market data available</div>;

  return (
    <table className="market-table">
      <thead>
        <tr>
          <th>Mandi</th>
          <th>Modal Price</th>
          <th>Min/Max</th>
          <th>Arrivals</th>
          <th>Distance</th>
          <th>AI Rec.</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => {
          const [mandi, price, minMax, arrivals, distance, rec] = row;
          const isBest = index === 0;
          const mandiName = mandi.split(' ').slice(0, -1).join(' ') || mandi;
          const mandiState = mandi.split(' ').pop();
          const priceClass = price >= 1400 ? 'up' : 'down';
          const recClass = rec.includes('SELL') ? 'sell' : rec.includes('HOLD') ? 'hold' : rec.includes('AVOID') ? 'avoid' : 'watch';

          return (
            <tr key={index} className={isBest ? 'best-row' : ''} data-testid={`market-row-${index}`}>
              <td>
                <strong>{mandiName}</strong>
                {mandiName !== mandi && <span className="mandi-state">{mandiState}</span>}
              </td>
              <td className={`price ${priceClass}`}>₹{price}</td>
              <td className="price-range">{minMax}</td>
              <td>{arrivals}</td>
              <td>{distance}</td>
              <td>
                <span className={`rec-tag ${recClass}`}>{rec}</span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default MarketTable;
