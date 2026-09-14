window.ITMS = window.ITMS || {};
ITMS.sections = ITMS.sections || {};

ITMS.sections.users = {
  render() {
    const el = document.getElementById('section-users');
    el.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 class="text-xl font-semibold">Users</h2>
        <button id="user-add-btn" class="itms-btn-primary"><i class="fa-solid fa-plus mr-1"></i>Add user</button>
      </div>
      <div class="overflow-x-auto bg-white rounded-xl border border-slate-200">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-left text-slate-500"><tr>
            <th class="px-4 py-2">Name</th><th class="px-4 py-2">Username</th><th class="px-4 py-2">Role</th>
            <th class="px-4 py-2">Email</th><th class="px-4 py-2"></th>
          </tr></thead>
          <tbody id="user-rows"></tbody>
        </table>
      </div>`;
    document.getElementById('user-add-btn').addEventListener('click', () => this.formModal());
    this.renderRows();
  },
  renderRows() {
    const self = ITMS.state.currentUser;
    document.getElementById('user-rows').innerHTML = ITMS.db.users.map(u => `
      <tr class="border-t border-slate-100 hover:bg-slate-50">
        <td class="px-4 py-2">${ITMS.render.esc(u.name)}</td>
        <td class="px-4 py-2 font-mono text-xs">${ITMS.render.esc(u.username)}</td>
        <td class="px-4 py-2">${ITMS.render.badge(u.role, u.role === 'admin' ? 'info' : 'neutral')}</td>
        <td class="px-4 py-2">${ITMS.render.esc(u.email)}</td>
        <td class="px-4 py-2 text-right whitespace-nowrap">
          <button class="itms-icon-btn" data-edit="${u.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
          ${u.id !== self.id ? `<button class="itms-icon-btn" style="color:#dc2626" data-del="${u.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>` : ''}
        </td>
      </tr>`).join('');
    document.querySelectorAll('#user-rows [data-edit]').forEach(b => b.addEventListener('click', () => this.formModal(+b.dataset.edit)));
    document.querySelectorAll('#user-rows [data-del]').forEach(b => b.addEventListener('click', () => this.confirmDelete(+b.dataset.del)));
  },
  formModal(id) {
    const u = id ? ITMS.db.users.find(x => x.id === id) : null;
    ITMS.modals.open({
      title: u ? 'Edit user' : 'Add user', body: `
      <form id="user-form" class="grid gap-3">
        <label class="itms-field"><span>Full name</span><input required name="name" value="${ITMS.render.esc(u?.name || '')}"></label>
        <label class="itms-field"><span>Username</span><input required name="username" value="${ITMS.render.esc(u?.username || '')}"></label>
        <label class="itms-field"><span>Email</span><input type="email" name="email" value="${ITMS.render.esc(u?.email || '')}"></label>
        <label class="itms-field"><span>Role</span><select name="role">${ITMS.constants.roles.map(r => `<option ${u?.role === r ? 'selected' : ''}>${r}</option>`).join('')}</select></label>
        <label class="itms-field"><span>Password${u ? ' (leave blank to keep current)' : ''}</span><input type="password" name="password"></label>
        <div class="flex gap-2 pt-2">
          <button type="submit" class="itms-btn-primary">${u ? 'Save changes' : 'Add user'}</button>
          <button type="button" class="itms-btn" id="user-cancel">Cancel</button>
        </div>
      </form>`
    });
    document.getElementById('user-cancel').addEventListener('click', ITMS.modals.close);
    document.getElementById('user-form').addEventListener('submit', e => {
      e.preventDefault();
      const fields = Object.fromEntries(new FormData(e.target).entries());
      if (!fields.password) delete fields.password;
      if (!fields.name.trim() || !fields.username.trim()) return;
      if (u) { ITMS.data.updateUser(u.id, fields); ITMS.render.toast('User updated'); }
      else { fields.password = fields.password || 'demo123'; ITMS.data.addUser(fields); ITMS.render.toast('User added'); }
      ITMS.modals.close();
      this.renderRows();
    });
  },
  confirmDelete(id) {
    const u = ITMS.db.users.find(x => x.id === id);
    ITMS.modals.open({
      title: 'Delete user?', body: `
      <p class="text-sm text-slate-600 mb-4">Delete "${ITMS.render.esc(u.name)}"? This only affects this demo session.</p>
      <div class="flex gap-2"><button id="del-yes" class="itms-btn-danger">Delete</button><button id="del-no" class="itms-btn">Cancel</button></div>`
    });
    document.getElementById('del-no').addEventListener('click', ITMS.modals.close);
    document.getElementById('del-yes').addEventListener('click', () => {
      ITMS.data.deleteUser(id);
      ITMS.modals.close();
      this.renderRows();
      ITMS.render.toast('User deleted');
    });
  },
};
