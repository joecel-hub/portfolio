window.ITMS = window.ITMS || {};
ITMS.sections = ITMS.sections || {};

ITMS.sections.transfers = {
  render() {
    const el = document.getElementById('section-transfers');
    const canApprove = ITMS.auth.can(['it', 'admin']);
    el.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 class="text-xl font-semibold">Transfers</h2>
        <button id="xfer-add-btn" class="itms-btn-primary"><i class="fa-solid fa-plus mr-1"></i>Request transfer</button>
      </div>
      <div class="overflow-x-auto bg-white rounded-xl border border-slate-200">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-left text-slate-500"><tr>
            <th class="px-4 py-2">Item</th><th class="px-4 py-2">From</th><th class="px-4 py-2">To</th>
            <th class="px-4 py-2">Requested by</th><th class="px-4 py-2">Status</th><th class="px-4 py-2">Requested at</th>
            <th class="px-4 py-2"></th>
          </tr></thead>
          <tbody id="xfer-rows"></tbody>
        </table>
      </div>`;
    document.getElementById('xfer-add-btn').addEventListener('click', () => this.formModal());
    this.renderRows(canApprove);
  },
  renderRows(canApprove) {
    canApprove = canApprove ?? ITMS.auth.can(['it', 'admin']);
    const rows = ITMS.db.transfers;
    document.getElementById('xfer-rows').innerHTML = rows.map(t => `
      <tr class="border-t border-slate-100 hover:bg-slate-50">
        <td class="px-4 py-2">${ITMS.render.esc(t.item_name)}</td>
        <td class="px-4 py-2">${ITMS.render.esc(t.from_location)}</td>
        <td class="px-4 py-2">${ITMS.render.esc(t.to_location)}</td>
        <td class="px-4 py-2">${ITMS.render.esc(t.requested_by)}</td>
        <td class="px-4 py-2">${ITMS.render.badge(t.status, ITMS.render.statusTone(t.status))}</td>
        <td class="px-4 py-2 whitespace-nowrap text-slate-500">${t.requested_at}</td>
        <td class="px-4 py-2 text-right whitespace-nowrap">
          ${canApprove && t.status === 'pending' ? `
            <button class="itms-icon-btn" style="color:#15803d" data-approve="${t.id}" title="Approve"><i class="fa-solid fa-check"></i></button>
            <button class="itms-icon-btn" style="color:#dc2626" data-reject="${t.id}" title="Reject"><i class="fa-solid fa-xmark"></i></button>` : ''}
          ${canApprove && t.status === 'approved' ? `<button class="itms-icon-btn" style="color:#4338ca" data-receive="${t.id}" title="Confirm receipt"><i class="fa-solid fa-box-open"></i></button>` : ''}
        </td>
      </tr>`).join('') || `<tr><td colspan="7" class="px-4 py-8 text-center text-slate-400">No transfers yet.</td></tr>`;
    document.querySelectorAll('#xfer-rows [data-approve]').forEach(b => b.addEventListener('click', () => this.decide(+b.dataset.approve, 'approved')));
    document.querySelectorAll('#xfer-rows [data-reject]').forEach(b => b.addEventListener('click', () => this.decide(+b.dataset.reject, 'rejected')));
    document.querySelectorAll('#xfer-rows [data-receive]').forEach(b => b.addEventListener('click', () => this.decide(+b.dataset.receive, 'received')));
  },
  decide(id, status) {
    ITMS.data.decideTransfer(id, status);
    this.renderRows();
    ITMS.sections.dashboard.render();
    ITMS.render.toast('Transfer ' + status);
  },
  formModal() {
    const assets = ITMS.db.assets;
    ITMS.modals.open({
      title: 'Request transfer', body: `
      <form id="xfer-form" class="grid grid-cols-1 gap-3">
        <label class="itms-field"><span>Asset</span><select name="asset_id">${assets.map(a => `<option value="${a.id}">${ITMS.render.esc(a.asset_name)} (${a.asset_id})</option>`).join('')}</select></label>
        <label class="itms-field"><span>Destination location</span><select name="to_location">${ITMS.constants.locations.map(l => `<option>${l}</option>`).join('')}</select></label>
        <div class="flex gap-2 pt-2">
          <button type="submit" class="itms-btn-primary">Submit request</button>
          <button type="button" class="itms-btn" id="xfer-cancel">Cancel</button>
        </div>
      </form>`
    });
    document.getElementById('xfer-cancel').addEventListener('click', ITMS.modals.close);
    document.getElementById('xfer-form').addEventListener('submit', e => {
      e.preventDefault();
      const fields = Object.fromEntries(new FormData(e.target).entries());
      const asset = assets.find(a => a.id === Number(fields.asset_id));
      if (!asset) return;
      ITMS.data.requestTransfer({
        item_type: 'asset',
        item_ref_id: asset.id,
        item_name: asset.asset_name,
        from_location: asset.location,
        to_location: fields.to_location,
        requested_by: ITMS.state.currentUser.name,
      });
      ITMS.modals.close();
      this.renderRows();
      ITMS.render.toast('Transfer requested');
    });
  },
};
