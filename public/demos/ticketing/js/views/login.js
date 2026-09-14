window.TKT = window.TKT || {};
TKT.views = TKT.views || {};

TKT.views.success = {
  render() {
    const el = document.getElementById('view-success');
    el.innerHTML = `
      <div class="tkt-success-wrap">
        <div class="tkt-success-icon"><i class="fa-solid fa-check"></i></div>
        <h1 style="font-size:1.4rem;font-weight:700;margin:0 0 0.5rem">Ticket submitted</h1>
        <p style="color:var(--muted);font-size:0.92rem">We've received your request. Keep this number for reference:</p>
        <div class="tkt-ticket-number">${TKT.render.esc(TKT.state.lastTicketNumber)}</div>
        <button class="tkt-btn-primary" id="success-back">Submit another ticket</button>
      </div>`;
    document.getElementById('success-back').addEventListener('click', () => TKT.app.showView('submit'));
  },
};

TKT.views.login = {
  render() {
    const el = document.getElementById('view-login');
    el.innerHTML = `
      <div class="tkt-login-wrap">
        <div class="tkt-login-brand">
          <img src="assets/logo.svg" alt="" style="width:50px;height:50px;margin-bottom:1.75rem">
          <h1 style="font-size:1.9rem;font-weight:700;margin:0 0 0.75rem;letter-spacing:-0.01em">Support Desk</h1>
          <p style="opacity:0.82;max-width:340px;line-height:1.65;font-size:0.95rem">The admin console for managing tickets, replies, and support staff across every site.</p>
          <div style="margin-top:2rem;display:flex;gap:1.5rem;font-size:0.8rem;opacity:0.65">
            <span><i class="fa-solid fa-ticket mr-1"></i>Tickets</span>
            <span><i class="fa-solid fa-chart-line mr-1"></i>Dashboard</span>
            <span><i class="fa-solid fa-users-gear mr-1"></i>Admins</span>
          </div>
          <a href="/" target="_blank" rel="noopener" class="tkt-credit">
            <span class="tkt-credit-mark">S&middot;B</span>
            <span>Built by <strong>Stryg.Bytes</strong> — view portfolio <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:0.7em"></i></span>
          </a>
        </div>
        <div class="tkt-login-form-panel">
          <div style="width:100%;max-width:360px">
            <img src="assets/logo.svg" alt="" style="width:38px;height:38px;margin-bottom:1rem" class="tkt-mobile-logo">
            <h2 style="font-size:1.3rem;font-weight:700;margin:0 0 0.3rem">Admin sign in</h2>
            <p style="color:var(--muted);font-size:0.88rem;margin:0 0 1.5rem">Self-contained demo — pick a role to try it.</p>
            <form id="login-form">
              <label class="tkt-field" style="margin-bottom:0.9rem"><span>Username</span><input id="login-user" required autocomplete="username"></label>
              <label class="tkt-field" style="margin-bottom:0.9rem"><span>Password</span><input id="login-pass" type="password" required autocomplete="current-password"></label>
              <button type="submit" class="tkt-btn-primary" style="width:100%">Sign in</button>
              <div style="color:#dc2626;font-size:0.82rem;min-height:1.2em;margin-top:0.5rem" id="login-err"></div>
            </form>
            <div style="margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid var(--line)">
              <p style="font-size:0.78rem;color:var(--muted);margin:0 0 0.6rem">Quick demo logins</p>
              <div style="display:flex;flex-wrap:wrap;gap:0.4rem">
                <button type="button" class="tkt-btn login-demo-fill" data-user="admin" data-pass="demo1234">Admin (HQ, Site A)</button>
                <button type="button" class="tkt-btn login-demo-fill" data-user="superadmin" data-pass="demo1234">Super Admin</button>
              </div>
            </div>
            <button type="button" class="tkt-btn" id="login-to-public" style="margin-top:1.25rem;width:100%"><i class="fa-solid fa-arrow-left mr-1"></i>Back to ticket form</button>
          </div>
        </div>
      </div>`;
    document.getElementById('login-form').addEventListener('submit', e => {
      e.preventDefault();
      const u = document.getElementById('login-user').value.trim();
      const p = document.getElementById('login-pass').value;
      const ok = TKT.auth.login(u, p);
      if (ok) TKT.app.showAdmin('dashboard');
      else document.getElementById('login-err').textContent = 'Invalid username or password.';
    });
    document.querySelectorAll('.login-demo-fill').forEach(b => b.addEventListener('click', () => {
      document.getElementById('login-user').value = b.dataset.user;
      document.getElementById('login-pass').value = b.dataset.pass;
    }));
    document.getElementById('login-to-public').addEventListener('click', () => TKT.app.showView('submit'));
  },
};
