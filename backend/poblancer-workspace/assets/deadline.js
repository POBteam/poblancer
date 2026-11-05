// All shares are percentages of the freelancer earnings pool, after POB's fee.
// This planner does not create agreements, send invitations or transfer money.
export function checkpoint(start, due) {
  const a = new Date(start).getTime(), b = new Date(due).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) throw new Error('The deadline must be after the start.');
  return new Date(a + (b - a) * .7);
}
export function splitEarnings(pool, shares) {
  const cents = Math.round(Number(pool) * 100);
  const basisPoints = shares.map(x => Math.round(Number(x) * 100));
  if (!Number.isSafeInteger(cents) || cents < 0 || basisPoints.some(x => !Number.isInteger(x) || x < 0 || x > 10000)) throw new Error('Enter valid amounts and percentages.');
  const total = basisPoints.reduce((a,b) => a+b,0);
  if (total > 10000) throw new Error('Support shares cannot exceed 100%.');
  const support = basisPoints.map(x => Math.floor(cents * x / 10000));
  return {primary:(cents-support.reduce((a,b)=>a+b,0))/100, support:support.map(x=>x/100), retained:(10000-total)/100};
}
