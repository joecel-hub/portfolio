window.TKT = window.TKT || {};

TKT.constants = {
  categories: [
    { key: 'technical', name: 'Technical Issue', color: '#4f46e5' },
    { key: 'account', name: 'Account Access', color: '#0891b2' },
    { key: 'billing', name: 'Billing', color: '#b45309' },
    { key: 'feature', name: 'Feature Request', color: '#15803d' },
    { key: 'general', name: 'General Inquiry', color: '#64748b' },
  ],
  priorities: ['low', 'medium', 'high', 'urgent'],
  statuses: ['open', 'in_progress', 'pending', 'resolved', 'closed'],
  locations: ['HQ', 'Site A', 'Site B', 'Site C'],
};

(function () {
  const C = TKT.constants;
  const NAMES = ['Dana Cruz', 'Marcus Webb', 'Elena Torres', 'Farah Idris', 'Omar Haddad', 'Liam Chen', 'Nadia Park', 'Victor Osei', 'Grace Kim', 'Tariq Malik', 'Sofia Reyes', 'Ben Novak'];

  function seedAdmins() {
    return [
      { id: 1, username: 'admin', password: 'demo1234', full_name: 'Jordan Lee', role: 'admin', locations: ['HQ', 'Site A'], is_active: true, initials: 'JL' },
      { id: 2, username: 'superadmin', password: 'demo1234', full_name: 'Alex Morgan', role: 'super_admin', locations: ['*'], is_active: true, initials: 'AM' },
    ];
  }

  const TICKET_SEED = [
    ['Cannot access company email', 'technical', 'high', 'resolved', 'HQ'],
    ['Laptop won’t turn on this morning', 'technical', 'urgent', 'in_progress', 'Site A'],
    ['Request: software license for design tool', 'feature', 'low', 'open', 'HQ'],
    ['VPN keeps disconnecting', 'technical', 'high', 'open', 'Site B'],
    ['Printer on 3rd floor not working', 'technical', 'medium', 'pending', 'HQ'],
    ['Need password reset', 'account', 'medium', 'closed', 'Site A'],
    ['Requesting a new monitor', 'general', 'low', 'open', 'Site C'],
    ['Network very slow at Site B', 'technical', 'urgent', 'in_progress', 'Site B'],
    ['Billing discrepancy on last invoice', 'billing', 'medium', 'open', 'HQ'],
    ['Account locked after failed logins', 'account', 'high', 'resolved', 'Site A'],
    ['Feature request: dark mode for portal', 'feature', 'low', 'open', 'HQ'],
    ['Unable to install approved software', 'technical', 'medium', 'pending', 'Site C'],
    ['Question about subscription renewal', 'billing', 'low', 'closed', 'HQ'],
    ['New employee needs system access', 'account', 'high', 'open', 'Site A'],
    ['Meeting room display not connecting', 'technical', 'medium', 'resolved', 'Site B'],
  ];

  function seedTickets() {
    return TICKET_SEED.map((r, i) => {
      const created = daysAgo(28 - i * 2);
      const resolved = (r[3] === 'resolved' || r[3] === 'closed') ? daysAgo(28 - i * 2 - 2) : '';
      return {
        id: i + 1,
        ticket_number: 'TCK-' + (100200 + i),
        user_name: NAMES[i % NAMES.length],
        user_email: NAMES[i % NAMES.length].toLowerCase().replace(' ', '.') + '@example.com',
        user_phone: '+1 555-01' + String(10 + i).padStart(2, '0'),
        location: r[4],
        subject: r[0],
        description: 'Sample demo description for "' + r[0] + '" — this is fictional placeholder content for the live demo.',
        category: r[1],
        priority: r[2],
        status: r[3],
        attachments: i % 4 === 0 ? [{ name: 'screenshot.png', size: '184 KB' }] : [],
        created_at: created,
        updated_at: created,
        resolved_at: resolved,
      };
    });
  }

  function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 16).replace('T', ' ');
  }

  function seedResponses(tickets) {
    const responses = [];
    let id = 1;
    tickets.forEach((t, i) => {
      if (i % 3 === 0) {
        responses.push({ id: id++, ticket_id: t.id, responder_name: 'Jordan Lee', is_admin: true, is_internal: false, message: 'Thanks for reaching out — we’re looking into this now.', created_at: t.created_at });
      }
      if (t.status === 'resolved' || t.status === 'closed') {
        responses.push({ id: id++, ticket_id: t.id, responder_name: 'Jordan Lee', is_admin: true, is_internal: false, message: 'This has been resolved. Let us know if the issue comes back.', created_at: t.resolved_at || t.updated_at });
      }
    });
    return responses;
  }

  TKT.data = {
    seed() {
      const tickets = seedTickets();
      TKT.db = {
        admins: seedAdmins(),
        tickets,
        responses: seedResponses(tickets),
        activity: [],
        nextIds: { ticket: tickets.length + 1, ticketNumber: 100200 + tickets.length, response: 100, admin: 3 },
      };
    },
    log(user, action, target) {
      TKT.db.activity.unshift({ id: TKT.db.activity.length + 1, user, action, target: target || '', timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ') });
    },
    submitTicket(fields) {
      const t = Object.assign({
        id: TKT.db.nextIds.ticket++,
        ticket_number: 'TCK-' + (TKT.db.nextIds.ticketNumber++),
        status: 'open',
        attachments: fields.attachments || [],
        created_at: new Date().toISOString().slice(0, 16).replace('T', ' '),
        updated_at: new Date().toISOString().slice(0, 16).replace('T', ' '),
        resolved_at: '',
      }, fields);
      TKT.db.tickets.unshift(t);
      this.log(t.user_name, 'Submitted ticket', t.ticket_number);
      return t;
    },
    addResponse(ticketId, { message, isInternal, adminName, newStatus }) {
      const t = TKT.db.tickets.find(x => x.id === ticketId);
      if (!t) return null;
      const r = { id: TKT.db.nextIds.response++, ticket_id: ticketId, responder_name: adminName, is_admin: true, is_internal: !!isInternal, message, created_at: new Date().toISOString().slice(0, 16).replace('T', ' ') };
      TKT.db.responses.push(r);
      if (newStatus && newStatus !== t.status) {
        t.status = newStatus;
        if (newStatus === 'resolved' || newStatus === 'closed') t.resolved_at = new Date().toISOString().slice(0, 16).replace('T', ' ');
        this.log(adminName, 'Changed status to ' + newStatus, t.ticket_number);
      }
      t.updated_at = new Date().toISOString().slice(0, 16).replace('T', ' ');
      this.log(adminName, isInternal ? 'Added internal note' : 'Replied to ticket', t.ticket_number);
      return r;
    },
    addAdmin(fields) {
      const initials = (fields.full_name || '??').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
      const a = Object.assign({ id: TKT.db.nextIds.admin++, is_active: true, initials }, fields);
      TKT.db.admins.push(a);
      return a;
    },
    updateAdmin(id, fields) {
      const a = TKT.db.admins.find(x => x.id === id);
      if (!a) return null;
      Object.assign(a, fields);
      return a;
    },
    toggleAdminActive(id) {
      const a = TKT.db.admins.find(x => x.id === id);
      if (a) a.is_active = !a.is_active;
    },
  };
})();
