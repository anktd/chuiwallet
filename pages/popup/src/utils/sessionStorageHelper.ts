export const SESSION_PASSWORD_KEY = '8C7822A5D65E99D67FDE93E344AF9';
const PASSWORD_TTL = 60 * 60 * 1000;

export async function setSessionPassword(pwd: string): Promise<void> {
  const data = { value: pwd, expiry: Date.now() + PASSWORD_TTL };
  await chrome.storage.session.set({ [SESSION_PASSWORD_KEY]: data });
}

export async function getSessionPassword(): Promise<string | null> {
  const result = await chrome.storage.session.get([SESSION_PASSWORD_KEY]);
  const data = result[SESSION_PASSWORD_KEY];
  if (!data) return null;
  if (Date.now() > data.expiry) {
    await chrome.storage.session.remove([SESSION_PASSWORD_KEY]);
    return null;
  }
  return data.value;
}
