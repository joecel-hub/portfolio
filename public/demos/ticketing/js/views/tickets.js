window.TKT = window.TKT || {};
TKT.views = TKT.views || {};

TKT.views.tickets = {
  perPage: 8,
  render() {
    const el = document.getElementById('section-tickets');
    const f = TKT.state.filters.tickets;
    const statuses = ['', ...TKT.constants.statuses];
    const labels = { '': 'All', open: 'Open', in_progress: 'In Progress', pending: 'Pending', resolved: 'Resolved', closed: 'Closed' };
    el.innerHTML = `
      <h2 class="text-xl font-semibold mb-4">Tickets</h2>
      <div class="flex flex-wrap gap-2 mb-4">
        ${statuses.map(s => `<button class="tkt-btn status-tab${f.status === s ? ' tkt-btn-primary' : ''}" data-status="${s}">${labels[s]}</button>`).join('')}
        <input id="tkt-q" placeholder="Search ticket # or subject…" class="tkt-input" style="margin-left:auto" value="${TKT.render.esc(f.q)}">
      </div>
      <div class="overflow-x-auto tkt-card" style="padding:0">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-left text-slate-500"><tr>
            <th class="px-4 py-2">Ticket #</th><th class="px-4 py-2">Subject</th><th class="px-4 py-2">Category</th>
            <th class="px-4 py-2">Priority</th><th class="px-4 py-2">Status</th><th class="px-4 py-2">Location</th><th class="px-4 py-2">Updated</th>
          </tr></thead>
          <tbody id="tkt-rows"></tbody>
        </table>
      </div>
      <div class="flex items-center justify-between mt-3" id="tkt-pager"></div>`;
    el.querySelectorAll('.status-tab').forEach(b => b.addEventListener('click', () => { f.status = b.dataset.status; f.page = 1; this.render(); }));
    document.getElementById('tkt-q').addEventListener('input', e => { f.q = e.target.value; f.page = 1; this.renderRows(); });
    this.renderRows();
  },
  filtered() {
    const f = TKT.state.filters.tickets;
    const q = f.q.toLowerCase();
    return TKT.db.tickets.filter(t => TKT.auth.canSeeTicket(t))
      .filter(t => !f.status || t.status === f.status)
      .filter(t => !q || (t.ticket_number + t.subject + t.user_name).toLowerCase().includes(q));
  },
  renderRows() {
    const f = TKT.state.filters.tickets;
    const all = this.filtered();
    const totalPages = Math.max(1, Math.ceil(all.length / this.perPage));
    f.page = Math.min(f.page, totalPages);
    const rows = all.slice((f.page - 1) * this.perPage, f.page * this.perPage);
    document.getElementById('tkt-rows').innerHTML = rows.map(t => `
      <tr class="border-t border-slate-100 hover:bg-slate-50 cursor-pointer" data-open="${t.id}">
        <td class="px-4 py-2 font-mono text-xs">${t.ticket_number}</td>
        <td class="px-4 py-2">${TKT.render.esc(t.subject)}</td>
        <td class="px-4 py-2">${TKT.render.categoryName(t.category)}</td>
        <td class="px-4 py-2">${TKT.render.priorityBadge(t.priority)}</td>
        <td class="px-4 py-2">${TKT.render.statusBadge(t.status)}</td>
        <td class="px-4 py-2">${TKT.render.esc(t.location)}</td>
        <td class="px-4 py-2 whitespace-nowrap text-slate-500">${t.updated_at.slice(0, 10)}</td>
      </tr>`).join('') || `<tr><td colspan="7" class="px-4 py-8 text-center text-slate-400">No tickets match your filters.</td></tr>`;
    document.querySelectorAll('#tkt-rows [data-open]').forEach(r => r.addEventListener('click', () => TKT.app.openTicket(+r.dataset.open)));
    const pager = document.getElementById('tkt-pager');
    pager.innerHTML = `<span class="text-xs text-slate-400">${all.length} ticket${all.length === 1 ? '' : 's'}</span>
      <div class="flex gap-2">
        <button class="tkt-icon-btn" id="tkt-prev" ${f.page <= 1 ? 'disabled' : ''}><i class="fa-solid fa-chevron-left"></i></button>
        <span class="text-xs text-slate-500" style="align-self:center">Page ${f.page} of ${totalPages}</span>
        <button class="tkt-icon-btn" id="tkt-next" ${f.page >= totalPages ? 'disabled' : ''}><i class="fa-solid fa-chevron-right"></i></button>
      </div>`;
    document.getElementById('tkt-prev').addEventListener('click', () => { if (f.page > 1) { f.page--; this.renderRows(); } });
    document.getElementById('tkt-next').addEventListener('click', () => { if (f.page < totalPages) { f.page++; this.renderRows(); } });
  },
};
