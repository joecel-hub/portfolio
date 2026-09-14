window.ITMS = window.ITMS || {};

ITMS.auth = {
  login(username, password) {
    const u = ITMS.db.users.find(x => x.username === username && x.password === password);
    if (!u) return false;
    ITMS.state.currentUser = u;
    ITMS.data.log(u.name, 'Logged in');
    document.body.classList.remove('logged-out');
    document.body.classList.add('logged-in');
    ITMS.app.renderNavForRole();
    ITMS.app.showSection('dashboard');
    return true;
  },
  logout() {
    if (ITMS.state.currentUser) ITMS.data.log(ITMS.state.currentUser.name, 'Logged out');
    ITMS.state.currentUser = null;
    document.body.classList.remove('logged-in');
    document.body.classList.add('logged-out');
  },
  can(roles) {
    const r = ITMS.state.currentUser && ITMS.state.currentUser.role;
    return roles.includes(r);
  },
};
