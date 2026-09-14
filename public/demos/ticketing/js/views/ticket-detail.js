window.TKT = window.TKT || {};
TKT.views = TKT.views || {};

TKT.views.ticketDetail = {
  render() {
    const el = document.getElementById('section-ticket-detail');
    const t = TKT.db.tickets.find(x => x.id === TKT.state.openTicketId);
    if (!t || !TKT.auth.canSeeTicket(t)) {
      el.innerHTML = `<p class="text-slate-400">Ticket not found.</p>`;
      return;
    }
    const responses = TKT.db.responses.filter(r => r.ticket_id === t.id).sort((a, b) => a.created_at.localeCompare(b.created_at));
    el.innerHTML = `
      <button class="tkt-btn" id="back-to-tickets" style="margin-bottom:1rem"><i class="fa-solid fa-arrow-left mr-1"></i>Back to tickets</button>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div class="lg:col-span-2">
          <div class="tkt-card" style="margin-bottom:1rem">
            <div class="flex items-center justify-between gap-2 mb-1">
              <span class="font-mono text-xs text-slate-400">${t.ticket_number}</span>
              ${TKT.render.statusBadge(t.status)}
            </div>
            <h2 class="text-lg font-semibold mb-2">${TKT.render.esc(t.subject)}</h2>
            <p class="text-sm text-slate-600 mb-3">${TKT.render.esc(t.description)}</p>
            ${t.attachments.length ? `<div class="tkt-file-list">${t.attachments.map(a => `<span class="tkt-file-chip"><i class="fa-solid fa-paperclip"></i>${TKT.render.esc(a.name)} (${a.size})</span>`).join('')}</div>` : ''}
          </div>
          <div class="tkt-card">
            <h3 class="font-medium mb-3 text-sm">Conversation</h3>
            <div id="thread">
              ${this.threadHtml(t, responses)}
            </div>
            <form id="reply-form" style="margin-top:1rem">
              <label class="tkt-field"><span>Reply</span><textarea name="message" required placeholder="Write a reply…"></textarea></label>
              <div class="flex flex-wrap items-center gap-3">
                <label style="display:flex;align-items:center;gap:0.4rem;font-size:0.82rem;color:var(--muted)"><input type="checkbox" name="is_internal"> Internal note (not sent to requester)</label>
                <select name="new_status" class="tkt-input">${TKT.constants.statuses.map(s => `<option value="${s}" ${s === t.status ? 'selected' : ''}>${s.replace('_', ' ')}</option>`).join('')}</select>
                <button type="submit" class="tkt-btn-primary">Send</button>
              </div>
            </form>
          </div>
        </div>
        <div>
          <div class="tkt-card">
            <h3 class="font-medium mb-3 text-sm">Details</h3>
            <dl class="text-sm grid gap-2">
              ${this.dl('Requester', t.user_name)}${this.dl('Email', t.user_email)}${this.dl('Phone', t.user_phone || '—')}
              ${this.dl('Category', TKT.render.categoryName(t.category))}${this.dl('Priority', t.priority)}${this.dl('Location', t.location)}
              ${this.dl('Created', t.created_at)}${this.dl('Updated', t.updated_at)}
            </dl>
          </div>
        </div>
      </div>`;
    document.getElementById('back-to-tickets').addEventListener('click', () => TKT.app.showAdmin('tickets'));
    document.getElementById('reply-form').addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const message = fd.get('message').trim();
      if (!message) return;
      TKT.data.addResponse(t.id, { message, isInternal: fd.get('is_internal') === 'on', adminName: TKT.state.currentAdmin.full_name, newStatus: fd.get('new_status') });
      TKT.render.toast('Reply sent');
      this.render();
    });
  },
  dl(k, v) { return `<div><dt class="text-slate-400 text-xs">${k}</dt><dd>${TKT.render.esc(v)}</dd></div>`; },
  threadHtml(t, responses) {
    const opener = `<div class="tkt-msg from-user"><div class="tkt-msg-meta"><span>${TKT.render.esc(t.user_name)}</span><span>${t.created_at}</span></div>${TKT.render.esc(t.description)}</div>`;
    const rest = responses.map(r => `<div class="tkt-msg ${r.is_internal ? 'from-internal' : 'from-admin'}"><div class="tkt-msg-meta"><span>${TKT.render.esc(r.responder_name)}${r.is_internal ? ' · internal note' : ''}</span><span>${r.created_at}</span></div>${TKT.render.esc(r.message)}</div>`).join('');
    return opener + rest;
  },
};
