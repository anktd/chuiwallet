const SESSION_KEY = 'walletPassword';
const PASSWORD_TTL = 60 * 60 * 1000;

export function setSessionPassword(pwd: string) {
  const data = { value: pwd, expiry: Date.now() + PASSWORD_TTL };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

export function getSessionPassword(): string | null {
  const itemStr = sessionStorage.getItem(SESSION_KEY);
  if (!itemStr) return null;

  try {
    const item = JSON.parse(itemStr);
    if (Date.now() > item.expiry) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return item.value;
  } catch (error) {
    console.error('Error parsing session password', error);
    return null;
  }
}
