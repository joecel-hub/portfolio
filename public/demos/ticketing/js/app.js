window.TKT = window.TKT || {};

TKT.app = {
  navItems: [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-gauge', roles: ['admin', 'super_admin'] },
    { id: 'tickets', label: 'Tickets', icon: 'fa-ticket', roles: ['admin', 'super_admin'] },
    { id: 'admins', label: 'Manage Admins', icon: 'fa-users-gear', roles: ['super_admin'] },
  ],
  showView(name) {
    TKT.state.activeView = name;
    ['submit', 'success', 'login', 'admin'].forEach(v => {
      const el = document.getElementById('view-' + v);
      if (el) el.classList.toggle('hidden', v !== name);
    });
    if (name === 'submit') TKT.views.submit.render();
    if (name === 'success') TKT.views.success.render();
    if (name === 'login') TKT.views.login.render();
  },
  showAdmin(section) {
    TKT.state.activeAdminSection = section;
    this.showView('admin');
    this.renderNav();
    document.querySelectorAll('.tkt-admin-section').forEach(s => s.classList.add('hidden'));
    document.getElementById('section-' + section).classList.remove('hidden');
    document.querySelectorAll('#tkt-nav [data-section]').forEach(b => b.classList.toggle('active', b.dataset.section === section));
    const item = this.navItems.find(n => n.id === section);
    document.getElementById('tkt-section-title').textContent = item ? item.label : (section === 'ticket-detail' ? 'Ticket' : '');
    if (section === 'dashboard') TKT.views.dashboard.render();
    else if (section === 'tickets') TKT.views.tickets.render();
    else if (section === 'admins') TKT.views.admins.render();
    else if (section === 'ticket-detail') TKT.views.ticketDetail.render();
    const sidebar = document.getElementById('tkt-sidebar');
    if (sidebar) sidebar.classList.remove('open');
  },
  openTicket(id) {
    TKT.state.openTicketId = id;
    this.showAdmin('ticket-detail');
  },
  renderNav() {
    const role = TKT.state.currentAdmin.role;
    const nav = document.getElementById('tkt-nav');
    nav.innerHTML = this.navItems.filter(n => n.roles.includes(role)).map(n => `
      <button data-section="${n.id}" class="tkt-nav-btn"><i class="fa-solid ${n.icon}" style="width:1.1rem"></i><span>${n.label}</span></button>`).join('');
    nav.querySelectorAll('[data-section]').forEach(b => b.addEventListener('click', () => this.showAdmin(b.dataset.section)));
    document.getElementById('tkt-user-name').textContent = TKT.state.currentAdmin.full_name;
    document.getElementById('tkt-user-role').textContent = role === 'super_admin' ? 'SUPER ADMIN' : 'ADMIN';
    document.getElementById('tkt-user-initials').textContent = TKT.state.currentAdmin.initials;
  },
  init() {
    document.getElementById('tkt-admin-link').addEventListener('click', () => TKT.app.showView('login'));
    document.getElementById('tkt-logout-btn').addEventListener('click', () => { TKT.auth.logout(); TKT.app.showView('login'); });
    const ham = document.getElementById('tkt-ham-btn');
    if (ham) ham.addEventListener('click', () => document.getElementById('tkt-sidebar').classList.toggle('open'));
    this.showView('submit');
  },
};

TKT.data.seed();
document.addEventListener('DOMContentLoaded', () => TKT.app.init());
