window.ITMS = window.ITMS || {};
ITMS.sections = ITMS.sections || {};

ITMS.sections.consumables = {
  render() {
    const el = document.getElementById('section-consumables');
    const canEdit = ITMS.auth.can(['it', 'admin']);
    const f = ITMS.state.filters.consumables;
    el.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 class="text-xl font-semibold">Consumables</h2>
        ${canEdit ? `<button id="cons-add-btn" class="itms-btn-primary"><i class="fa-solid fa-plus mr-1"></i>Add consumable</button>` : ''}
      </div>
      <div class="flex flex-wrap gap-2 mb-4">
        <input id="cons-q" placeholder="Search item name…" class="itms-input" value="${ITMS.render.esc(f.q)}">
        <select id="cons-category" class="itms-input">${this.opts(ITMS.constants.consumableCategories, f.category)}</select>
        <select id="cons-location" class="itms-input">${this.opts(ITMS.constants.locations, f.location)}</select>
      </div>
      <div class="overflow-x-auto bg-white rounded-xl border border-slate-200">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-left text-slate-500"><tr>
            <th class="px-4 py-2">Item</th><th class="px-4 py-2">Category</th><th class="px-4 py-2">Qty</th>
            <th class="px-4 py-2">Location</th><th class="px-4 py-2">End user</th><th class="px-4 py-2"></th>
          </tr></thead>
          <tbody id="cons-rows"></tbody>
        </table>
      </div>`;
    document.getElementById('cons-q').addEventListener('input', e => { f.q = e.target.value; this.renderRows(); });
    document.getElementById('cons-category').addEventListener('change', e => { f.category = e.target.value; this.renderRows(); });
    document.getElementById('cons-location').addEventListener('change', e => { f.location = e.target.value; this.renderRows(); });
    if (canEdit) document.getElementById('cons-add-btn').addEventListener('click', () => this.formModal());
    this.renderRows();
  },
  opts(list, selected) {
    return `<option value="">All</option>` + list.map(v => `<option value="${v}" ${v === selected ? 'selected' : ''}>${v}</option>`).join('');
  },
  filtered() {
    const f = ITMS.state.filters.consumables;
    const q = f.q.toLowerCase();
    return ITMS.db.consumables.filter(c =>
      (!q || c.item_name.toLowerCase().includes(q)) &&
      (!f.category || c.category === f.category) &&
      (!f.location || c.location === f.location)
    );
  },
  renderRows() {
    const canEdit = ITMS.auth.can(['it', 'admin']);
    const rows = this.filtered();
    document.getElementById('cons-rows').innerHTML = rows.map(c => `
      <tr class="border-t border-slate-100 hover:bg-slate-50" data-id="${c.id}">
        <td class="px-4 py-2">${ITMS.render.esc(c.item_name)}</td>
        <td class="px-4 py-2">${ITMS.render.esc(c.category)}</td>
        <td class="px-4 py-2">${c.quantity}</td>
        <td class="px-4 py-2">${ITMS.render.esc(c.location)}</td>
        <td class="px-4 py-2">${ITMS.render.esc(c.end_user) || '—'}</td>
        <td class="px-4 py-2 text-right whitespace-nowrap">
          ${canEdit ? `<button class="itms-icon-btn" data-edit="${c.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
          <button class="itms-icon-btn" style="color:#dc2626" data-del="${c.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>` : ''}
        </td>
      </tr>`).join('') || `<tr><td colspan="6" class="px-4 py-8 text-center text-slate-400">No consumables match your filters.</td></tr>`;
    document.querySelectorAll('#cons-rows [data-edit]').forEach(b => b.addEventListener('click', () => this.formModal(+b.dataset.edit)));
    document.querySelectorAll('#cons-rows [data-del]').forEach(b => b.addEventListener('click', () => this.confirmDelete(+b.dataset.del)));
  },
  formModal(id) {
    const c = id ? ITMS.db.consumables.find(x => x.id === id) : null;
    ITMS.modals.open({
      title: c ? 'Edit consumable' : 'Add consumable', wide: true, body: `
      <form id="cons-form" class="grid grid-cols-2 gap-3">
        <label class="itms-field col-span-2"><span>Item name</span><input required name="item_name" value="${ITMS.render.esc(c?.item_name || '')}"></label>
        <label class="itms-field"><span>Category</span><select name="category">${ITMS.constants.consumableCategories.map(v => `<option ${c?.category === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <label class="itms-field"><span>Quantity</span><input type="number" name="quantity" value="${c?.quantity ?? 1}"></label>
        <label class="itms-field"><span>Location</span><select name="location">${ITMS.constants.locations.map(v => `<option ${c?.location === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <label class="itms-field"><span>End user</span><input name="end_user" value="${ITMS.render.esc(c?.end_user || '')}"></label>
        <label class="itms-field"><span>Date issued</span><input type="date" name="date_issued" value="${c?.date_issued || ''}"></label>
        <label class="itms-field col-span-2"><span>Remarks</span><textarea name="remarks">${ITMS.render.esc(c?.remarks || '')}</textarea></label>
        <div class="col-span-2 flex gap-2 pt-2">
          <button type="submit" class="itms-btn-primary">${c ? 'Save changes' : 'Add consumable'}</button>
          <button type="button" class="itms-btn" id="cons-cancel">Cancel</button>
        </div>
      </form>`
    });
    document.getElementById('cons-cancel').addEventListener('click', ITMS.modals.close);
    document.getElementById('cons-form').addEventListener('submit', e => {
      e.preventDefault();
      const fields = Object.fromEntries(new FormData(e.target).entries());
      fields.quantity = Number(fields.quantity) || 0;
      if (!fields.item_name.trim()) return;
      if (c) { ITMS.data.updateConsumable(c.id, fields); ITMS.render.toast('Consumable updated'); }
      else { ITMS.data.addConsumable(fields); ITMS.render.toast('Consumable added'); }
      ITMS.modals.close();
      this.renderRows();
      ITMS.sections.dashboard.render();
    });
  },
  confirmDelete(id) {
    const c = ITMS.db.consumables.find(x => x.id === id);
    ITMS.modals.open({
      title: 'Delete consumable?', body: `
      <p class="text-sm text-slate-600 mb-4">Delete "${ITMS.render.esc(c.item_name)}"? This only affects this demo session.</p>
      <div class="flex gap-2"><button id="del-yes" class="itms-btn-danger">Delete</button><button id="del-no" class="itms-btn">Cancel</button></div>`
    });
    document.getElementById('del-no').addEventListener('click', ITMS.modals.close);
    document.getElementById('del-yes').addEventListener('click', () => {
      ITMS.data.deleteConsumable(id);
      ITMS.modals.close();
      this.renderRows();
      ITMS.render.toast('Consumable deleted');
      ITMS.sections.dashboard.render();
    });
  },
};
