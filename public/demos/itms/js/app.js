window.ITMS = window.ITMS || {};

ITMS.app = {
  navItems: [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-gauge', roles: ['admin', 'it', 'hr', 'viewer'] },
    { id: 'assets', label: 'IT Assets', icon: 'fa-laptop', roles: ['admin', 'it', 'hr', 'viewer'] },
    { id: 'consumables', label: 'Consumables', icon: 'fa-boxes-stacked', roles: ['admin', 'it', 'hr', 'viewer'] },
    { id: 'transfers', label: 'Transfers', icon: 'fa-right-left', roles: ['admin', 'it', 'hr', 'viewer'] },
    { id: 'reports', label: 'Reports', icon: 'fa-chart-pie', roles: ['admin', 'it', 'hr', 'viewer'] },
    { id: 'logs', label: 'Activity Logs', icon: 'fa-clock-rotate-left', roles: ['admin', 'it', 'hr', 'viewer'] },
    { id: 'users', label: 'Users', icon: 'fa-users-gear', roles: ['admin'] },
    { id: 'settings', label: 'Settings', icon: 'fa-gear', roles: ['admin', 'it', 'hr', 'viewer'] },
  ],
  renderNavForRole() {
    const role = ITMS.state.currentUser.role;
    const nav = document.getElementById('itms-nav');
    nav.innerHTML = this.navItems.filter(n => n.roles.includes(role)).map(n => `
      <button data-section="${n.id}" class="itms-nav-btn"><i class="fa-solid ${n.icon}" style="width:1.1rem"></i><span>${n.label}</span></button>`).join('');
    nav.querySelectorAll('[data-section]').forEach(b => b.addEventListener('click', () => this.showSection(b.dataset.section)));
    document.getElementById('itms-user-name').textContent = ITMS.state.currentUser.name;
    document.getElementById('itms-user-role').textContent = ITMS.state.currentUser.role.toUpperCase();
    document.getElementById('itms-user-initials').textContent = ITMS.state.currentUser.initials;
  },
  showSection(id) {
    ITMS.state.activeSection = id;
    document.querySelectorAll('.itms-section').forEach(s => s.classList.add('hidden'));
    document.getElementById('section-' + id).classList.remove('hidden');
    document.querySelectorAll('#itms-nav [data-section]').forEach(b => b.classList.toggle('active', b.dataset.section === id));
    const item = this.navItems.find(n => n.id === id);
    document.getElementById('itms-section-title').textContent = item ? item.label : '';
    ITMS.sections[id].render();
    const sidebar = document.getElementById('itms-sidebar');
    if (sidebar) sidebar.classList.remove('open');
  },
  init() {
    document.getElementById('itms-login-form').addEventListener('submit', e => {
      e.preventDefault();
      const u = document.getElementById('itms-login-user').value.trim();
      const p = document.getElementById('itms-login-pass').value;
      const ok = ITMS.auth.login(u, p);
      document.getElementById('itms-login-err').textContent = ok ? '' : 'Invalid username or password.';
    });
    document.querySelectorAll('.itms-demo-fill').forEach(b => b.addEventListener('click', () => {
      document.getElementById('itms-login-user').value = b.dataset.user;
      document.getElementById('itms-login-pass').value = b.dataset.pass;
    }));
    document.getElementById('itms-logout-btn').addEventListener('click', () => ITMS.auth.logout());
    const ham = document.getElementById('itms-ham-btn');
    if (ham) ham.addEventListener('click', () => document.getElementById('itms-sidebar').classList.toggle('open'));
  },
};

ITMS.data.seed();
document.addEventListener('DOMContentLoaded', () => ITMS.app.init());
