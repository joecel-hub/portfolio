window.TKT = window.TKT || {};
TKT.views = TKT.views || {};

TKT.views.dashboard = {
  chart: null,
  render() {
    const el = document.getElementById('section-dashboard');
    const visible = TKT.db.tickets.filter(t => TKT.auth.canSeeTicket(t));
    const open = visible.filter(t => t.status === 'open').length;
    const inProgress = visible.filter(t => t.status === 'in_progress').length;
    const urgent = visible.filter(t => t.priority === 'urgent').length;
    const recent = visible.slice(0, 5);
    el.innerHTML = `
      <h2 class="text-xl font-semibold mb-4">Dashboard</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        ${this.stat('Total Tickets', visible.length, 'fa-ticket', '#e0e7ff', '#4338ca')}
        ${this.stat('Open', open, 'fa-envelope-open', '#e0f2fe', '#0369a1')}
        ${this.stat('In Progress', inProgress, 'fa-spinner', '#fef3c7', '#b45309')}
        ${this.stat('Urgent', urgent, 'fa-triangle-exclamation', '#fee2e2', '#b91c1c')}
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div class="tkt-card">
          <h3 class="font-medium mb-3 text-sm">Tickets — last 30 days</h3>
          <canvas id="trend-chart" height="200"></canvas>
        </div>
        <div class="tkt-card">
          <h3 class="font-medium mb-3 text-sm">Recent tickets</h3>
          <ul class="divide-y divide-slate-100">
            ${recent.map(t => `<li class="py-2 flex justify-between text-sm gap-2 cursor-pointer" data-open="${t.id}"><span><strong>${TKT.render.esc(t.ticket_number)}</strong> ${TKT.render.esc(t.subject)}</span>${TKT.render.statusBadge(t.status)}</li>`).join('') || '<li class="py-3 text-slate-400 text-sm">No tickets yet.</li>'}
          </ul>
        </div>
      </div>`;
    el.querySelectorAll('[data-open]').forEach(li => li.addEventListener('click', () => TKT.app.openTicket(+li.dataset.open)));
    this.drawChart(visible);
  },
  stat(label, value, icon, bg, fg) {
    return `<div class="tkt-card">
      <div class="flex items-center justify-between">
        <div><div class="text-2xl font-semibold">${value}</div><div class="text-sm text-slate-500">${label}</div></div>
        <div style="width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:${bg};color:${fg}"><i class="fa-solid ${icon}"></i></div>
      </div>
    </div>`;
  },
  drawChart(tickets) {
    const days = [];
    const counts = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push(key.slice(5));
      counts.push(tickets.filter(t => t.created_at.startsWith(key)).length);
    }
    if (this.chart) this.chart.destroy();
    this.chart = new Chart(document.getElementById('trend-chart'), {
      type: 'line',
      data: { labels: days, datasets: [{ data: counts, borderColor: '#0f766e', backgroundColor: 'rgba(15,118,110,0.12)', fill: true, tension: 0.35, pointRadius: 0 }] },
      options: { plugins: { legend: { display: false } }, scales: { x: { ticks: { maxTicksLimit: 6, font: { size: 10 } } }, y: { beginAtZero: true, ticks: { stepSize: 1 } } } },
    });
  },
};
