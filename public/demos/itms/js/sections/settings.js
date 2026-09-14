window.ITMS = window.ITMS || {};
ITMS.sections = ITMS.sections || {};

ITMS.sections.settings = {
  render() {
    const el = document.getElementById('section-settings');
    const u = ITMS.state.currentUser;
    el.innerHTML = `
      <h2 class="text-xl font-semibold mb-4">Settings</h2>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="bg-white rounded-xl border border-slate-200 p-5">
          <h3 class="font-medium mb-3 text-sm">Profile</h3>
          <div class="flex items-center gap-3 mb-4">
            <div style="width:44px;height:44px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:600">${u.initials}</div>
            <div><div class="font-medium">${ITMS.render.esc(u.name)}</div><div class="text-xs text-slate-400">${u.role.toUpperCase()}</div></div>
          </div>
          <dl class="text-sm grid grid-cols-2 gap-2">
            <div><dt class="text-slate-400 text-xs">Username</dt><dd>${ITMS.render.esc(u.username)}</dd></div>
            <div><dt class="text-slate-400 text-xs">Email</dt><dd>${ITMS.render.esc(u.email)}</dd></div>
          </dl>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-5">
          <h3 class="font-medium mb-3 text-sm">Change password</h3>
          <form id="pw-form" class="grid gap-3">
            <label class="itms-field"><span>Current password</span><input type="password" required></label>
            <label class="itms-field"><span>New password</span><input type="password" required></label>
            <button type="submit" class="itms-btn-primary" style="width:fit-content">Update password</button>
          </form>
        </div>
      </div>`;
    document.getElementById('pw-form').addEventListener('submit', e => {
      e.preventDefault();
      ITMS.data.log(u.name, 'Changed password');
      ITMS.render.toast('Password updated (demo only — nothing is stored)');
      e.target.reset();
    });
  },
};
