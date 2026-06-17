function getCSRFToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : '';
}

function csrfSafeFetch(url, options = {}) {
    const headers = options.headers || {};
    headers['X-CSRFToken'] = getCSRFToken();
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    return fetch(url, { ...options, headers });
}
