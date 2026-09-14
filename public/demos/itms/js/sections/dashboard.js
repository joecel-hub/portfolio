window.ITMS = window.ITMS || {};
ITMS.sections = ITMS.sections || {};

ITMS.sections.dashboard = {
  render() {
    const el = document.getElementById('section-dashboard');
    const assets = ITMS.db.assets, consumables = ITMS.db.consumables, transfers = ITMS.db.transfers;
    const pending = transfers.filter(t => t.status === 'pending').length;
    const recent = ITMS.db.logs.slice(0, 6);
    el.innerHTML = `
      <h2 class="text-xl font-semibold mb-4">Dashboard</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        ${this.stat('Total Assets', assets.length, 'fa-laptop', 'indigo')}
        ${this.stat('Consumables', consumables.length, 'fa-boxes-stacked', 'teal')}
        ${this.stat('Pending Transfers', pending, 'fa-right-left', 'amber')}
        ${this.stat('Active Users', ITMS.db.users.length, 'fa-users', 'slate')}
      </div>
      <div class="bg-white rounded-xl border border-slate-200 p-5">
        <h3 class="font-medium mb-3">Recent activity</h3>
        <ul class="divide-y divide-slate-100">
          ${recent.map(l => `<li class="py-2 flex justify-between text-sm gap-3"><span><strong>${ITMS.render.esc(l.user)}</strong> ${ITMS.render.esc(l.action)}${l.target ? ' — ' + ITMS.render.esc(l.target) : ''}</span><span class="text-slate-400 whitespace-nowrap">${l.timestamp}</span></li>`).join('') || '<li class="py-3 text-slate-400 text-sm">No activity yet.</li>'}
        </ul>
      </div>`;
  },
  stat(label, value, icon, color) {
    const colors = {
      indigo: 'background:#e0e7ff;color:#4338ca;',
      teal: 'background:#ccfbf1;color:#0f766e;',
      amber: 'background:#fef3c7;color:#b45309;',
      slate: 'background:#f1f5f9;color:#475569;',
    };
    return `<div class="bg-white rounded-xl border border-slate-200 p-5">
      <div class="flex items-center justify-between">
        <div><div class="text-2xl font-semibold">${value}</div><div class="text-sm text-slate-500">${label}</div></div>
        <div style="width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;${colors[color] || colors.slate}"><i class="fa-solid ${icon}"></i></div>
      </div>
    </div>`;
  },
};
