function getLocalStorageItem(key: string) {
  return localStorage.getItem(key);
}

function setLocalStorageItem(key: string, value: string) {
  localStorage.setItem(key, value);
}

function removeLocalStorageItem(key: string) {
  localStorage.removeItem(key);
}

function getSessionStorageItem(key: string) {
  return sessionStorage.getItem(key);
}

function setSessionStorageItem(key: string, value: string) {
  sessionStorage.setItem(key, value);
}

function removeSessionStorageItem(key: string) {
  sessionStorage.removeItem(key);
}

export {
  getLocalStorageItem,
  setLocalStorageItem,
  removeLocalStorageItem,
  getSessionStorageItem,
  setSessionStorageItem,
  removeSessionStorageItem,
};
