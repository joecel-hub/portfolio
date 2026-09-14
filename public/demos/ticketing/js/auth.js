window.TKT = window.TKT || {};

TKT.auth = {
  login(username, password) {
    const a = TKT.db.admins.find(x => x.username === username && x.password === password && x.is_active);
    if (!a) return false;
    TKT.state.currentAdmin = a;
    TKT.data.log(a.full_name, 'Logged in');
    return true;
  },
  logout() {
    if (TKT.state.currentAdmin) TKT.data.log(TKT.state.currentAdmin.full_name, 'Logged out');
    TKT.state.currentAdmin = null;
  },
  isSuperAdmin() {
    return TKT.state.currentAdmin && TKT.state.currentAdmin.role === 'super_admin';
  },
  canSeeTicket(ticket) {
    const a = TKT.state.currentAdmin;
    if (!a) return false;
    if (a.role === 'super_admin' || a.locations.includes('*')) return true;
    return a.locations.includes(ticket.location);
  },
};
