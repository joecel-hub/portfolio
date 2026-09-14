window.ITMS = window.ITMS || {};

ITMS.render = {
  esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },
  badge(text, tone) {
    const tones = {
      success: 'background:#dcfce7;color:#15803d;',
      warning: 'background:#fef3c7;color:#b45309;',
      danger: 'background:#fee2e2;color:#b91c1c;',
      neutral: 'background:#f1f5f9;color:#475569;',
      info: 'background:#e0e7ff;color:#4338ca;',
    };
    const style = tones[tone] || tones.neutral;
    return `<span style="${style}padding:0.15rem 0.55rem;border-radius:999px;font-size:0.72rem;font-weight:600;white-space:nowrap">${this.esc(text)}</span>`;
  },
  statusTone(status) {
    return { 'In Use': 'success', 'In Storage': 'neutral', 'Under Repair': 'warning', 'Disposed': 'danger', pending: 'warning', approved: 'info', received: 'success', rejected: 'danger' }[status] || 'neutral';
  },
  toast(message, tone) {
    const el = document.getElementById('toast');
    el.textContent = message;
    el.className = 'itms-toast show' + (tone === 'error' ? ' err' : '');
    clearTimeout(this._t);
    this._t = setTimeout(() => { el.className = 'itms-toast'; }, 2600);
  },
};
