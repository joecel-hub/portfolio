window.ITMS = window.ITMS || {};

ITMS.state = {
  currentUser: null,
  activeSection: 'dashboard',
  filters: {
    assets: { q: '', category: '', status: '', location: '' },
    consumables: { q: '', category: '', location: '' },
    logs: { scope: 'mine' },
  },
};
