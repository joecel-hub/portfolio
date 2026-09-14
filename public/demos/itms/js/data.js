window.ITMS = window.ITMS || {};

ITMS.constants = {
  assetCategories: ['CPU', 'Monitor', 'Laptop', 'Desktop All-In-One', 'Server Rack/Tower', 'CCTV Camera', 'Router', 'UPS', 'Printer', 'Biometric Machine', 'NVR', 'NANO Station', 'Telephone', 'External HDD', 'Switch', 'Access Point', 'Other'],
  assetStatuses: ['In Use', 'In Storage', 'Under Repair', 'Disposed'],
  consumableCategories: ['CD ROM', 'Ethernet Switch', 'Cable/Adapter', 'Flash Drives', 'Internal Drive', 'Keyboard/Mouse', 'Power Supply', 'RAM', 'Software License', 'Battery Replace', 'USB Hub/Docking Station', 'Networking Equipment', 'Mobile/Tablet', 'Other'],
  locations: ['HQ', 'Site A', 'Site B', 'Site C'],
  departments: ['IT', 'Finance', 'HR', 'Operations', 'Sales', 'Engineering'],
  roles: ['admin', 'it', 'hr', 'viewer'],
};

(function () {
  const C = ITMS.constants;
  const NAMES = ['Dana Cruz', 'Marcus Webb', 'Elena Torres', 'Farah Idris', 'Omar Haddad', 'Liam Chen', 'Nadia Park', 'Victor Osei', 'Grace Kim', 'Tariq Malik', 'Sofia Reyes', 'Ben Novak', 'Priya Shah', 'Noah Bennett', 'Aisha Bello'];

  function seedUsers() {
    return [
      { id: 1, username: 'admin', password: 'admin123', name: 'Alex Morgan', role: 'admin', email: 'admin@demo.itms', initials: 'AM' },
      { id: 2, username: 'it', password: 'it123', name: 'Jordan Lee', role: 'it', email: 'it@demo.itms', initials: 'JL' },
      { id: 3, username: 'hr', password: 'hr123', name: 'Priya Nair', role: 'hr', email: 'hr@demo.itms', initials: 'PN' },
      { id: 4, username: 'viewer', password: 'viewer123', name: 'Sam Rivera', role: 'viewer', email: 'viewer@demo.itms', initials: 'SR' },
    ];
  }

  const ASSET_SEED = [
    ['Laptop', 'Dell Latitude 5540', 'In Use'],
    ['Laptop', 'MacBook Pro 14"', 'In Use'],
    ['Desktop All-In-One', 'HP EliteOne 800', 'In Use'],
    ['CPU', 'Dell OptiPlex 3020', 'In Storage'],
    ['Monitor', 'Dell 24" P2422H', 'In Use'],
    ['Monitor', 'LG 27UP850', 'Under Repair'],
    ['Server Rack/Tower', 'Dell PowerEdge R740', 'In Use'],
    ['CCTV Camera', 'Hikvision DS-2CD2143', 'In Use'],
    ['Router', 'Cisco ISR 4331', 'In Use'],
    ['UPS', 'APC Smart-UPS 1500', 'In Use'],
    ['Printer', 'HP LaserJet M404', 'In Use'],
    ['Biometric Machine', 'ZKTeco uFace800', 'In Use'],
    ['NVR', 'Hikvision DS-7608NI', 'In Use'],
    ['NANO Station', 'Ubiquiti NanoStation 5AC', 'In Storage'],
    ['Telephone', 'Cisco IP Phone 7841', 'In Use'],
    ['External HDD', 'Seagate 2TB Backup', 'In Storage'],
    ['Switch', 'Cisco Catalyst 2960', 'In Use'],
    ['Laptop', 'Lenovo ThinkPad T14', 'Disposed'],
  ];

  function seedAssets() {
    return ASSET_SEED.map((r, i) => {
      const assigned = r[2] === 'In Use' ? NAMES[i % NAMES.length] : '';
      return {
        id: i + 1,
        asset_id: 'DEMO-IT' + (1000 + i),
        asset_name: r[0] + ' — ' + r[1],
        category: r[0],
        serial_number: r[0].slice(0, 3).toUpperCase() + '-' + (1000 + i),
        model: r[1],
        status: r[2],
        location: C.locations[i % C.locations.length],
        assigned_to: assigned,
        department: C.departments[i % C.departments.length],
        vendor: 'Demo Supplies Co.',
        purchase_date: '2025-' + String((i % 12) + 1).padStart(2, '0') + '-1' + (i % 9),
        price: 300 + (i * 137) % 2200,
        remarks: '',
      };
    });
  }

  const CONSUMABLE_SEED = [
    ['Software License', 'Microsoft 365 Business', 24],
    ['RAM', 'Kingston 16GB DDR4', 12],
    ['Cable/Adapter', 'USB-C to HDMI Adapter', 30],
    ['Keyboard/Mouse', 'Logitech MK540 Combo', 15],
    ['Flash Drives', 'SanDisk 64GB USB 3.0', 40],
    ['Power Supply', 'Dell 65W AC Adapter', 10],
    ['Battery Replace', 'Biometric Backup Battery', 8],
    ['Networking Equipment', 'Cat6 Patch Cable 5m', 60],
    ['USB Hub/Docking Station', 'Dell WD19 Dock', 6],
    ['Mobile/Tablet', 'iPad 10th Gen (Loaner)', 4],
    ['Internal Drive', 'Samsung 1TB SSD', 9],
    ['Ethernet Switch', 'TP-Link 8-Port Switch', 5],
  ];

  function seedConsumables() {
    return CONSUMABLE_SEED.map((r, i) => ({
      id: i + 1,
      item_name: r[1],
      category: r[0],
      quantity: r[2],
      location: C.locations[i % C.locations.length],
      end_user: i % 3 === 0 ? NAMES[(i + 3) % NAMES.length] : '',
      date_issued: '2025-' + String((i % 12) + 1).padStart(2, '0') + '-0' + ((i % 8) + 1),
      remarks: '',
    }));
  }

  function seedTransfers(assets) {
    const statuses = ['pending', 'approved', 'received', 'rejected'];
    return [0, 1, 2, 3, 4, 5].map(i => {
      const asset = assets[i % assets.length];
      const st = statuses[i % statuses.length];
      return {
        id: i + 1,
        item_type: 'asset',
        item_ref_id: asset.id,
        item_name: asset.asset_name,
        from_location: asset.location,
        to_location: C.locations[(i + 1) % C.locations.length],
        requested_by: NAMES[(i + 5) % NAMES.length],
        status: st,
        requested_at: '2026-0' + ((i % 9) + 1) + '-1' + (i % 9) + ' 0' + (9 + i % 3) + ':30',
        decided_by: st === 'pending' ? '' : 'Jordan Lee',
        decided_at: st === 'pending' ? '' : '2026-0' + ((i % 9) + 1) + '-1' + ((i + 1) % 9),
      };
    });
  }

  function seedLogs() {
    const actions = ['Logged in', 'Added asset', 'Updated consumable', 'Requested transfer', 'Approved transfer', 'Exported report', 'Changed password'];
    return Array.from({ length: 16 }).map((_, i) => ({
      id: i + 1,
      user: NAMES[i % NAMES.length],
      action: actions[i % actions.length],
      target: i % 2 === 0 ? 'DEMO-IT' + (1000 + (i % 18)) : '',
      timestamp: '2026-09-' + String((i % 28) + 1).padStart(2, '0') + ' ' + String(8 + (i % 10)).padStart(2, '0') + ':' + String((i * 7) % 60).padStart(2, '0'),
    }));
  }

  ITMS.data = {
    seed() {
      const assets = seedAssets();
      ITMS.db = {
        users: seedUsers(),
        assets,
        consumables: seedConsumables(),
        transfers: seedTransfers(assets),
        logs: seedLogs(),
        nextIds: { asset: assets.length + 1, consumable: CONSUMABLE_SEED.length + 1, transfer: 7, user: 5, log: 17 },
      };
    },
    log(user, action, target) {
      ITMS.db.logs.unshift({ id: ITMS.db.nextIds.log++, user, action, target: target || '', timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ') });
    },
    addAsset(fields) {
      const a = Object.assign({ id: ITMS.db.nextIds.asset++, remarks: '' }, fields);
      ITMS.db.assets.unshift(a);
      this.log(ITMS.state.currentUser.name, 'Added asset', a.asset_id);
      return a;
    },
    updateAsset(id, fields) {
      const a = ITMS.db.assets.find(x => x.id === id);
      if (!a) return null;
      Object.assign(a, fields);
      this.log(ITMS.state.currentUser.name, 'Updated asset', a.asset_id);
      return a;
    },
    deleteAsset(id) {
      const a = ITMS.db.assets.find(x => x.id === id);
      ITMS.db.assets = ITMS.db.assets.filter(x => x.id !== id);
      if (a) this.log(ITMS.state.currentUser.name, 'Deleted asset', a.asset_id);
    },
    addConsumable(fields) {
      const c = Object.assign({ id: ITMS.db.nextIds.consumable++, remarks: '' }, fields);
      ITMS.db.consumables.unshift(c);
      this.log(ITMS.state.currentUser.name, 'Added consumable', c.item_name);
      return c;
    },
    updateConsumable(id, fields) {
      const c = ITMS.db.consumables.find(x => x.id === id);
      if (!c) return null;
      Object.assign(c, fields);
      this.log(ITMS.state.currentUser.name, 'Updated consumable', c.item_name);
      return c;
    },
    deleteConsumable(id) {
      const c = ITMS.db.consumables.find(x => x.id === id);
      ITMS.db.consumables = ITMS.db.consumables.filter(x => x.id !== id);
      if (c) this.log(ITMS.state.currentUser.name, 'Deleted consumable', c.item_name);
    },
    requestTransfer(fields) {
      const t = Object.assign({ id: ITMS.db.nextIds.transfer++, status: 'pending', requested_at: new Date().toISOString().slice(0, 16).replace('T', ' '), decided_by: '', decided_at: '' }, fields);
      ITMS.db.transfers.unshift(t);
      this.log(ITMS.state.currentUser.name, 'Requested transfer', t.item_name);
      return t;
    },
    decideTransfer(id, status) {
      const t = ITMS.db.transfers.find(x => x.id === id);
      if (!t) return null;
      t.status = status;
      t.decided_by = ITMS.state.currentUser.name;
      t.decided_at = new Date().toISOString().slice(0, 16).replace('T', ' ');
      if (status === 'approved' || status === 'received') {
        const a = ITMS.db.assets.find(x => x.id === t.item_ref_id);
        if (a) a.location = t.to_location;
      }
      const verb = status === 'approved' ? 'Approved transfer' : status === 'rejected' ? 'Rejected transfer' : 'Confirmed receipt';
      this.log(ITMS.state.currentUser.name, verb, t.item_name);
      return t;
    },
    addUser(fields) {
      const initials = (fields.name || '??').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
      const u = Object.assign({ id: ITMS.db.nextIds.user++, initials }, fields);
      ITMS.db.users.push(u);
      this.log(ITMS.state.currentUser.name, 'Added user', u.username);
      return u;
    },
    updateUser(id, fields) {
      const u = ITMS.db.users.find(x => x.id === id);
      if (!u) return null;
      Object.assign(u, fields);
      this.log(ITMS.state.currentUser.name, 'Updated user', u.username);
      return u;
    },
    deleteUser(id) {
      const u = ITMS.db.users.find(x => x.id === id);
      ITMS.db.users = ITMS.db.users.filter(x => x.id !== id);
      if (u) this.log(ITMS.state.currentUser.name, 'Deleted user', u.username);
    },
  };
})();
