window.ITMS = window.ITMS || {};
ITMS.sections = ITMS.sections || {};

ITMS.sections.reports = {
  charts: { category: null, status: null },
  render() {
    const el = document.getElementById('section-reports');
    el.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 class="text-xl font-semibold">Reports</h2>
        <button id="report-pdf-btn" class="itms-btn-primary"><i class="fa-solid fa-file-arrow-down mr-1"></i>Print / Export PDF</button>
      </div>
      <div id="reportPrintArea">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div class="bg-white rounded-xl border border-slate-200 p-5">
            <h3 class="font-medium mb-3 text-sm">Assets by category</h3>
            <canvas id="chart-category" height="220"></canvas>
          </div>
          <div class="bg-white rounded-xl border border-slate-200 p-5">
            <h3 class="font-medium mb-3 text-sm">Status breakdown</h3>
            <canvas id="chart-status" height="220"></canvas>
          </div>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-5">
          <h3 class="font-medium mb-3 text-sm">Summary</h3>
          <table class="w-full text-sm">
            <tbody>
              <tr class="border-t border-slate-100"><td class="py-2 text-slate-500">Total assets</td><td class="py-2 text-right font-medium">${ITMS.db.assets.length}</td></tr>
              <tr class="border-t border-slate-100"><td class="py-2 text-slate-500">Total consumables</td><td class="py-2 text-right font-medium">${ITMS.db.consumables.length}</td></tr>
              <tr class="border-t border-slate-100"><td class="py-2 text-slate-500">Pending transfers</td><td class="py-2 text-right font-medium">${ITMS.db.transfers.filter(t => t.status === 'pending').length}</td></tr>
              <tr class="border-t border-slate-100"><td class="py-2 text-slate-500">Total asset value</td><td class="py-2 text-right font-medium">$${ITMS.db.assets.reduce((s, a) => s + (Number(a.price) || 0), 0).toLocaleString()}</td></tr>
            </tbody>
          </table>
        </div>
      </div>`;
    this.drawCharts();
    document.getElementById('report-pdf-btn').addEventListener('click', () => {
      const area = document.getElementById('reportPrintArea');
      html2pdf().from(area).set({ margin: 10, filename: 'ITMS-Report.pdf' }).save();
    });
  },
  drawCharts() {
    const byCategory = {};
    ITMS.db.assets.forEach(a => { byCategory[a.category] = (byCategory[a.category] || 0) + 1; });
    const byStatus = {};
    ITMS.db.assets.forEach(a => { byStatus[a.status] = (byStatus[a.status] || 0) + 1; });

    if (this.charts.category) this.charts.category.destroy();
    if (this.charts.status) this.charts.status.destroy();

    this.charts.category = new Chart(document.getElementById('chart-category'), {
      type: 'bar',
      data: {
        labels: Object.keys(byCategory),
        datasets: [{ data: Object.values(byCategory), backgroundColor: '#3d3aa8', borderRadius: 4 }],
      },
      options: { plugins: { legend: { display: false } }, scales: { x: { ticks: { autoSkip: false, font: { size: 10 } } } } },
    });

    const statusColors = { 'In Use': '#15803d', 'In Storage': '#64748b', 'Under Repair': '#b45309', 'Disposed': '#b91c1c' };
    this.charts.status = new Chart(document.getElementById('chart-status'), {
      type: 'doughnut',
      data: {
        labels: Object.keys(byStatus),
        datasets: [{ data: Object.values(byStatus), backgroundColor: Object.keys(byStatus).map(s => statusColors[s] || '#94a3b8') }],
      },
      options: { plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } } } },
    });
  },
};
