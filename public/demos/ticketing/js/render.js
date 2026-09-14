window.TKT = window.TKT || {};

TKT.render = {
  esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },
  categoryName(key) {
    const c = TKT.constants.categories.find(x => x.key === key);
    return c ? c.name : key;
  },
  categoryColor(key) {
    const c = TKT.constants.categories.find(x => x.key === key);
    return c ? c.color : '#64748b';
  },
  priorityBadge(p) {
    const tones = { low: 'background:#f1f5f4;color:#475569;', medium: 'background:#e0e7ff;color:#4338ca;', high: 'background:#fef3c7;color:#b45309;', urgent: 'background:#fee2e2;color:#b91c1c;' };
    return `<span style="${tones[p] || tones.low}padding:0.15rem 0.55rem;border-radius:999px;font-size:0.72rem;font-weight:600;text-transform:capitalize;white-space:nowrap">${this.esc(p)}</span>`;
  },
  statusBadge(s) {
    const tones = { open: 'background:#e0e7ff;color:#4338ca;', in_progress: 'background:#fef3c7;color:#b45309;', pending: 'background:#f1f5f4;color:#475569;', resolved: 'background:#dcfce7;color:#15803d;', closed: 'background:#f1f5f4;color:#64748b;' };
    const labels = { open: 'Open', in_progress: 'In Progress', pending: 'Pending', resolved: 'Resolved', closed: 'Closed' };
    return `<span style="${tones[s] || tones.open}padding:0.15rem 0.55rem;border-radius:999px;font-size:0.72rem;font-weight:600;white-space:nowrap">${labels[s] || s}</span>`;
  },
  toast(message, tone) {
    const el = document.getElementById('toast');
    el.textContent = message;
    el.className = 'tkt-toast show' + (tone === 'error' ? ' err' : '');
    clearTimeout(this._t);
    this._t = setTimeout(() => { el.className = 'tkt-toast'; }, 2600);
  },
};
