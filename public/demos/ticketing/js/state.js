window.TKT = window.TKT || {};

TKT.state = {
  currentAdmin: null,
  activeView: 'submit',
  activeAdminSection: 'dashboard',
  openTicketId: null,
  filters: {
    tickets: { status: '', q: '', page: 1 },
  },
  lastTicketNumber: '',
};
