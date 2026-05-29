/**
 * Price unit formatting utilities for ₹/quintal ↔ ₹/kg conversion.
 * 1 quintal = 100 kg, so price_per_kg = price_per_quintal / 100.
 */

export const formatPrice = (price, unit) => {
  if (!price) return 'N/A';
  const val = unit === 'kg' ? price / 100 : price;
  return `₹${unit === 'kg' ? val.toFixed(2) : Math.round(val).toLocaleString('en-IN')}`;
};

export const unitLabel = (unit) => (unit === 'kg' ? '₹/kg' : '₹/q');

export const convertPrice = (price, unit) => {
  if (!price) return 0;
  return unit === 'kg' ? price / 100 : price;
};

export function UnitToggle({ unit, setUnit }) {
  return (
    <div className="unit-toggle">
      <button
        className={unit === 'quintal' ? 'active' : ''}
        onClick={() => setUnit('quintal')}
      >
        ₹/quintal
      </button>
      <button
        className={unit === 'kg' ? 'active' : ''}
        onClick={() => setUnit('kg')}
      >
        ₹/kg
      </button>
    </div>
  );
}
