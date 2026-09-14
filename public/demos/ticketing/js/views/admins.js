window.TKT = window.TKT || {};
TKT.views = TKT.views || {};

TKT.views.admins = {
  render() {
    const el = document.getElementById('section-admins');
    el.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 class="text-xl font-semibold">Manage Admins</h2>
        <button id="admin-add-btn" class="tkt-btn-primary"><i class="fa-solid fa-plus mr-1"></i>Add admin</button>
      </div>
      <div class="overflow-x-auto tkt-card" style="padding:0">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-left text-slate-500"><tr>
            <th class="px-4 py-2">Name</th><th class="px-4 py-2">Username</th><th class="px-4 py-2">Role</th>
            <th class="px-4 py-2">Locations</th><th class="px-4 py-2">Status</th><th class="px-4 py-2"></th>
          </tr></thead>
          <tbody id="admin-rows"></tbody>
        </table>
      </div>`;
    document.getElementById('admin-add-btn').addEventListener('click', () => this.formModal());
    this.renderRows();
  },
  renderRows() {
    const self = TKT.state.currentAdmin;
    document.getElementById('admin-rows').innerHTML = TKT.db.admins.map(a => `
      <tr class="border-t border-slate-100 hover:bg-slate-50">
        <td class="px-4 py-2">${TKT.render.esc(a.full_name)}</td>
        <td class="px-4 py-2 font-mono text-xs">${TKT.render.esc(a.username)}</td>
        <td class="px-4 py-2">${a.role === 'super_admin' ? 'Super Admin' : 'Admin'}</td>
        <td class="px-4 py-2">${a.locations.includes('*') ? 'All' : a.locations.join(', ')}</td>
        <td class="px-4 py-2">${a.is_active ? TKT.render.statusBadge('open').replace('Open', 'Active') : TKT.render.statusBadge('closed').replace('Closed', 'Inactive')}</td>
        <td class="px-4 py-2 text-right whitespace-nowrap">
          <button class="tkt-icon-btn" data-edit="${a.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
          ${a.id !== self.id ? `<button class="tkt-icon-btn" data-toggle="${a.id}" title="${a.is_active ? 'Deactivate' : 'Activate'}"><i class="fa-solid ${a.is_active ? 'fa-user-slash' : 'fa-user-check'}"></i></button>` : ''}
        </td>
      </tr>`).join('');
    document.querySelectorAll('#admin-rows [data-edit]').forEach(b => b.addEventListener('click', () => this.formModal(+b.dataset.edit)));
    document.querySelectorAll('#admin-rows [data-toggle]').forEach(b => b.addEventListener('click', () => { TKT.data.toggleAdminActive(+b.dataset.toggle); this.renderRows(); TKT.render.toast('Admin status updated'); }));
  },
  formModal(id) {
    const a = id ? TKT.db.admins.find(x => x.id === id) : null;
    const locs = TKT.constants.locations;
    TKT.modals.open({
      title: a ? 'Edit admin' : 'Add admin', body: `
      <form id="admin-form" class="grid gap-3">
        <label class="tkt-field"><span>Full name</span><input required name="full_name" value="${TKT.render.esc(a?.full_name || '')}"></label>
        <label class="tkt-field"><span>Username</span><input required name="username" value="${TKT.render.esc(a?.username || '')}"></label>
        <label class="tkt-field"><span>Role</span>
          <select name="role" id="admin-role">
            <option value="admin" ${a?.role !== 'super_admin' ? 'selected' : ''}>Admin (location-scoped)</option>
            <option value="super_admin" ${a?.role === 'super_admin' ? 'selected' : ''}>Super Admin (all locations)</option>
          </select>
        </label>
        <div id="admin-locs">
          <span style="font-size:0.8rem;color:var(--muted)">Locations</span>
          <div style="display:flex;flex-wrap:wrap;gap:0.6rem;margin-top:0.3rem">
            ${locs.map(l => `<label style="display:flex;align-items:center;gap:0.3rem;font-size:0.85rem"><input type="checkbox" name="loc" value="${l}" ${a?.locations.includes(l) ? 'checked' : ''}>${l}</label>`).join('')}
          </div>
        </div>
        <label class="tkt-field"><span>Password${a ? ' (leave blank to keep current)' : ''}</span><input type="password" name="password"></label>
        <div class="flex gap-2 pt-2">
          <button type="submit" class="tkt-btn-primary">${a ? 'Save changes' : 'Add admin'}</button>
          <button type="button" class="tkt-btn" id="admin-cancel">Cancel</button>
        </div>
      </form>`
    });
    const toggleLocs = () => { document.getElementById('admin-locs').style.display = document.getElementById('admin-role').value === 'super_admin' ? 'none' : 'block'; };
    document.getElementById('admin-role').addEventListener('change', toggleLocs);
    toggleLocs();
    document.getElementById('admin-cancel').addEventListener('click', TKT.modals.close);
    document.getElementById('admin-form').addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const role = fd.get('role');
      const fields = { full_name: fd.get('full_name').trim(), username: fd.get('username').trim(), role, locations: role === 'super_admin' ? ['*'] : fd.getAll('loc') };
      if (fd.get('password')) fields.password = fd.get('password');
      if (!fields.full_name || !fields.username) return;
      if (a) { TKT.data.updateAdmin(a.id, fields); TKT.render.toast('Admin updated'); }
      else { fields.password = fields.password || 'demo1234'; TKT.data.addAdmin(fields); TKT.render.toast('Admin added'); }
      TKT.modals.close();
      this.renderRows();
    });
  },
};
