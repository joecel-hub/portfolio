window.ITMS = window.ITMS || {};
ITMS.sections = ITMS.sections || {};

ITMS.sections.logs = {
  render() {
    const el = document.getElementById('section-logs');
    const isAdmin = ITMS.auth.can(['admin', 'it']);
    const mine = ITMS.db.logs.filter(l => l.user === ITMS.state.currentUser.name);
    const rows = isAdmin ? ITMS.db.logs : mine;
    el.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 class="text-xl font-semibold">Activity Logs</h2>
        ${!isAdmin ? `<span class="text-xs text-slate-400">Showing your activity only</span>` : ''}
      </div>
      <div class="overflow-x-auto bg-white rounded-xl border border-slate-200">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-left text-slate-500"><tr>
            <th class="px-4 py-2">User</th><th class="px-4 py-2">Action</th><th class="px-4 py-2">Target</th><th class="px-4 py-2">Time</th>
          </tr></thead>
          <tbody>
            ${rows.map(l => `
              <tr class="border-t border-slate-100">
                <td class="px-4 py-2">${ITMS.render.esc(l.user)}</td>
                <td class="px-4 py-2">${ITMS.render.esc(l.action)}</td>
                <td class="px-4 py-2 font-mono text-xs">${ITMS.render.esc(l.target) || '—'}</td>
                <td class="px-4 py-2 whitespace-nowrap text-slate-500">${l.timestamp}</td>
              </tr>`).join('') || `<tr><td colspan="4" class="px-4 py-8 text-center text-slate-400">No activity recorded yet.</td></tr>`}
          </tbody>
        </table>
      </div>`;
  },
};
