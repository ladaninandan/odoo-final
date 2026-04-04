/**
 * Backend origin without path (e.g. http://192.168.1.10:5000).
 *
 * When the app is opened from a phone at http://192.168.x.x:3000, the API must use the
 * same host (http://192.168.x.x:5000). If REACT_APP_API_URL is http://localhost:5000,
 * axios on the phone would call the phone itself — requests fail and self-order shows
 * "invalid link". So: when the page host is not localhost, we always derive the API host
 * from window.location (unless REACT_APP_FORCE_LAN is not needed — we just prioritize LAN).
 */

const DEFAULT_API_PORT = process.env.REACT_APP_SERVER_PORT || '5000';

export function getServerOrigin() {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const h = window.location.hostname;
    if (h && h !== 'localhost' && h !== '127.0.0.1') {
      return `http://${h}:${DEFAULT_API_PORT}`;
    }
  }
  if (process.env.REACT_APP_SOCKET_URL) {
    return process.env.REACT_APP_SOCKET_URL.replace(/\/$/, '');
  }
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.replace(/\/$/, '').replace(/\/api$/, '');
  }
  return `http://localhost:${DEFAULT_API_PORT}`;
}

export function getApiBaseUrl() {
  return `${getServerOrigin()}/api`;
}

export function getSocketUrl() {
  return getServerOrigin();
}
