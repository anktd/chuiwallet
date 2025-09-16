const apiBaseUrl: string = 'https://www.blockonomics.co/';
const apiV1Namespace: string = 'api/';

export async function getBitcoinPrice(currency: string = 'USD') {
  const url = `${apiBaseUrl}${apiV1Namespace}price?currency=${currency}`;
  const options = { method: 'GET', headers: { accept: 'application/json' } };
  const response = await fetch(url, options);
  const payload: { price: number } = await response.json();
  return payload?.price;
}
