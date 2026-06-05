import { AssetTicker } from '@/types/wdk-types';
import formatAmount from './format-amount';
import getDisplaySymbol from './get-display-symbol';

const formatTokenAmount = (amount: number, token: AssetTicker, includeSymbol: boolean = true) => {
  const symbol = getDisplaySymbol(token);

  if (amount === 0) return `0.00${includeSymbol ? ` ${symbol}` : ''}`;

  // Minimum 4 decimal places so small crypto amounts (e.g. 0.048 ETH) don't
  // round aggressively to 2dp ("0.05"). Trailing zeros are still cut by
  // minimumFractionDigits: 0, so 1000 USDT still shows as "1,000" not "1,000.0000".
  let decimals = Math.max(Math.ceil(Math.abs(Math.log10(amount))), 4);

  const formattedAmount = formatAmount(amount, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });

  return `${formattedAmount}${includeSymbol ? ` ${symbol}` : ''}`;
};

export default formatTokenAmount;
