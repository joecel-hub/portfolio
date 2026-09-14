window.ITMS = window.ITMS || {};
ITMS.sections = ITMS.sections || {};

ITMS.sections.assets = {
  render() {
    const el = document.getElementById('section-assets');
    const canEdit = ITMS.auth.can(['it', 'admin']);
    const f = ITMS.state.filters.assets;
    el.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 class="text-xl font-semibold">IT Assets</h2>
        ${canEdit ? `<button id="asset-add-btn" class="itms-btn-primary"><i class="fa-solid fa-plus mr-1"></i>Add asset</button>` : ''}
      </div>
      <div class="flex flex-wrap gap-2 mb-4">
        <input id="asset-q" placeholder="Search name or ID…" class="itms-input" value="${ITMS.render.esc(f.q)}">
        <select id="asset-category" class="itms-input">${this.opts(ITMS.constants.assetCategories, f.category)}</select>
        <select id="asset-status" class="itms-input">${this.opts(ITMS.constants.assetStatuses, f.status)}</select>
        <select id="asset-location" class="itms-input">${this.opts(ITMS.constants.locations, f.location)}</select>
      </div>
      <div class="overflow-x-auto bg-white rounded-xl border border-slate-200">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-left text-slate-500"><tr>
            <th class="px-4 py-2">Asset ID</th><th class="px-4 py-2">Name</th><th class="px-4 py-2">Category</th>
            <th class="px-4 py-2">Status</th><th class="px-4 py-2">Location</th><th class="px-4 py-2">Assigned to</th>
            <th class="px-4 py-2"></th>
          </tr></thead>
          <tbody id="asset-rows"></tbody>
        </table>
      </div>`;
    document.getElementById('asset-q').addEventListener('input', e => { f.q = e.target.value; this.renderRows(); });
    document.getElementById('asset-category').addEventListener('change', e => { f.category = e.target.value; this.renderRows(); });
    document.getElementById('asset-status').addEventListener('change', e => { f.status = e.target.value; this.renderRows(); });
    document.getElementById('asset-location').addEventListener('change', e => { f.location = e.target.value; this.renderRows(); });
    if (canEdit) document.getElementById('asset-add-btn').addEventListener('click', () => this.formModal());
    this.renderRows();
  },
  opts(list, selected) {
    return `<option value="">All</option>` + list.map(v => `<option value="${v}" ${v === selected ? 'selected' : ''}>${v}</option>`).join('');
  },
  filtered() {
    const f = ITMS.state.filters.assets;
    const q = f.q.toLowerCase();
    return ITMS.db.assets.filter(a =>
      (!q || (a.asset_name + a.asset_id).toLowerCase().includes(q)) &&
      (!f.category || a.category === f.category) &&
      (!f.status || a.status === f.status) &&
      (!f.location || a.location === f.location)
    );
  },
  renderRows() {
    const canEdit = ITMS.auth.can(['it', 'admin']);
    const rows = this.filtered();
    document.getElementById('asset-rows').innerHTML = rows.map(a => `
      <tr class="border-t border-slate-100 hover:bg-slate-50" data-id="${a.id}">
        <td class="px-4 py-2 font-mono text-xs">${a.asset_id}</td>
        <td class="px-4 py-2">${ITMS.render.esc(a.asset_name)}</td>
        <td class="px-4 py-2">${ITMS.render.esc(a.category)}</td>
        <td class="px-4 py-2">${ITMS.render.badge(a.status, ITMS.render.statusTone(a.status))}</td>
        <td class="px-4 py-2">${ITMS.render.esc(a.location)}</td>
        <td class="px-4 py-2">${ITMS.render.esc(a.assigned_to) || '—'}</td>
        <td class="px-4 py-2 text-right whitespace-nowrap">
          <button class="itms-icon-btn" data-view="${a.id}" title="View"><i class="fa-solid fa-eye"></i></button>
          ${canEdit ? `<button class="itms-icon-btn" data-edit="${a.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
          <button class="itms-icon-btn" style="color:#dc2626" data-del="${a.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>` : ''}
        </td>
      </tr>`).join('') || `<tr><td colspan="7" class="px-4 py-8 text-center text-slate-400">No assets match your filters.</td></tr>`;
    document.querySelectorAll('#asset-rows [data-view]').forEach(b => b.addEventListener('click', () => this.detailModal(+b.dataset.view)));
    document.querySelectorAll('#asset-rows [data-edit]').forEach(b => b.addEventListener('click', () => this.formModal(+b.dataset.edit)));
    document.querySelectorAll('#asset-rows [data-del]').forEach(b => b.addEventListener('click', () => this.confirmDelete(+b.dataset.del)));
  },
  detailModal(id) {
    const a = ITMS.db.assets.find(x => x.id === id);
    ITMS.modals.open({
      title: a.asset_name, body: `
      <dl class="grid grid-cols-2 gap-3 text-sm">
        ${this.dl('Asset ID', a.asset_id)}${this.dl('Category', a.category)}${this.dl('Model', a.model)}
        ${this.dl('Serial number', a.serial_number)}${this.dl('Status', a.status)}${this.dl('Location', a.location)}
        ${this.dl('Assigned to', a.assigned_to || '—')}${this.dl('Department', a.department)}
        ${this.dl('Vendor', a.vendor)}${this.dl('Purchase date', a.purchase_date)}${this.dl('Price', '$' + a.price)}
      </dl>${a.remarks ? `<p class="mt-3 text-sm text-slate-500">${ITMS.render.esc(a.remarks)}</p>` : ''}`
    });
  },
  dl(k, v) { return `<div><dt class="text-slate-400 text-xs">${k}</dt><dd>${ITMS.render.esc(v)}</dd></div>`; },
  formModal(id) {
    const a = id ? ITMS.db.assets.find(x => x.id === id) : null;
    ITMS.modals.open({
      title: a ? 'Edit asset' : 'Add asset', wide: true, body: `
      <form id="asset-form" class="grid grid-cols-2 gap-3">
        <label class="itms-field col-span-2"><span>Asset name</span><input required name="asset_name" value="${ITMS.render.esc(a?.asset_name || '')}"></label>
        <label class="itms-field"><span>Category</span><select name="category">${ITMS.constants.assetCategories.map(c => `<option ${a?.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
        <label class="itms-field"><span>Status</span><select name="status">${ITMS.constants.assetStatuses.map(c => `<option ${a?.status === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
        <label class="itms-field"><span>Model</span><input name="model" value="${ITMS.render.esc(a?.model || '')}"></label>
        <label class="itms-field"><span>Serial number</span><input name="serial_number" value="${ITMS.render.esc(a?.serial_number || '')}"></label>
        <label class="itms-field"><span>Location</span><select name="location">${ITMS.constants.locations.map(c => `<option ${a?.location === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
        <label class="itms-field"><span>Department</span><select name="department">${ITMS.constants.departments.map(c => `<option ${a?.department === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
        <label class="itms-field"><span>Assigned to</span><input name="assigned_to" value="${ITMS.render.esc(a?.assigned_to || '')}"></label>
        <label class="itms-field"><span>Vendor</span><input name="vendor" value="${ITMS.render.esc(a?.vendor || '')}"></label>
        <label class="itms-field"><span>Purchase date</span><input type="date" name="purchase_date" value="${a?.purchase_date || ''}"></label>
        <label class="itms-field"><span>Price (USD)</span><input type="number" name="price" value="${a?.price || 0}"></label>
        <label class="itms-field col-span-2"><span>Remarks</span><textarea name="remarks">${ITMS.render.esc(a?.remarks || '')}</textarea></label>
        <div class="col-span-2 flex gap-2 pt-2">
          <button type="submit" class="itms-btn-primary">${a ? 'Save changes' : 'Add asset'}</button>
          <button type="button" class="itms-btn" id="asset-cancel">Cancel</button>
        </div>
      </form>`
    });
    document.getElementById('asset-cancel').addEventListener('click', ITMS.modals.close);
    document.getElementById('asset-form').addEventListener('submit', e => {
      e.preventDefault();
      const fields = Object.fromEntries(new FormData(e.target).entries());
      fields.price = Number(fields.price) || 0;
      if (!fields.asset_name.trim()) return;
      if (a) { ITMS.data.updateAsset(a.id, fields); ITMS.render.toast('Asset updated'); }
      else { fields.asset_id = 'DEMO-IT' + (1000 + ITMS.db.nextIds.asset); ITMS.data.addAsset(fields); ITMS.render.toast('Asset added'); }
      ITMS.modals.close();
      this.renderRows();
      ITMS.sections.dashboard.render();
    });
  },
  confirmDelete(id) {
    const a = ITMS.db.assets.find(x => x.id === id);
    ITMS.modals.open({
      title: 'Delete asset?', body: `
      <p class="text-sm text-slate-600 mb-4">Delete "${ITMS.render.esc(a.asset_name)}"? This only affects this demo session.</p>
      <div class="flex gap-2"><button id="del-yes" class="itms-btn-danger">Delete</button><button id="del-no" class="itms-btn">Cancel</button></div>`
    });
    document.getElementById('del-no').addEventListener('click', ITMS.modals.close);
    document.getElementById('del-yes').addEventListener('click', () => {
      ITMS.data.deleteAsset(id);
      ITMS.modals.close();
      this.renderRows();
      ITMS.render.toast('Asset deleted');
      ITMS.sections.dashboard.render();
    });
  },
};
