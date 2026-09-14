window.TKT = window.TKT || {};
TKT.views = TKT.views || {};

TKT.views.submit = {
  pendingFiles: [],
  render() {
    const el = document.getElementById('view-submit-body');
    const C = TKT.constants;
    el.innerHTML = `
      <div class="tkt-public-wrap">
        <div class="tkt-hero">
          <h1>Submit a support ticket</h1>
          <p>Tell us what's going on and our team will follow up by email.</p>
        </div>
        <div class="tkt-card">
          <form id="submit-form">
            <div class="tkt-grid-2">
              <label class="tkt-field"><span>Full name</span><input required name="user_name"></label>
              <label class="tkt-field"><span>Email</span><input required type="email" name="user_email"></label>
            </div>
            <div class="tkt-grid-2">
              <label class="tkt-field"><span>Phone (optional)</span><input name="user_phone"></label>
              <label class="tkt-field"><span>Location</span><select name="location">${C.locations.map(l => `<option>${l}</option>`).join('')}</select></label>
            </div>
            <div class="tkt-grid-2">
              <label class="tkt-field"><span>Category</span><select name="category">${C.categories.map(c => `<option value="${c.key}">${c.name}</option>`).join('')}</select></label>
              <label class="tkt-field"><span>Priority</span><select name="priority">${C.priorities.map(p => `<option value="${p}">${p[0].toUpperCase() + p.slice(1)}</option>`).join('')}</select></label>
            </div>
            <label class="tkt-field"><span>Subject</span><input required name="subject"></label>
            <label class="tkt-field"><span>Description</span><textarea required name="description" placeholder="Describe the issue in as much detail as you can..."></textarea></label>
            <label class="tkt-field">
              <span>Attachments (optional)</span>
              <div class="tkt-file-drop" id="file-drop"><i class="fa-solid fa-paperclip mr-1"></i>Click to attach files (demo only — nothing is uploaded)</div>
              <input type="file" id="file-input" multiple style="display:none">
              <div class="tkt-file-list" id="file-list"></div>
            </label>
            <button type="submit" class="tkt-btn-primary" style="width:100%;margin-top:0.5rem">Submit ticket</button>
          </form>
        </div>
      </div>`;
    this.pendingFiles = [];
    document.getElementById('file-drop').addEventListener('click', () => document.getElementById('file-input').click());
    document.getElementById('file-input').addEventListener('change', e => {
      this.pendingFiles = Array.from(e.target.files).map(f => ({ name: f.name, size: (f.size / 1024).toFixed(0) + ' KB' }));
      document.getElementById('file-list').innerHTML = this.pendingFiles.map(f => `<span class="tkt-file-chip"><i class="fa-solid fa-file"></i>${TKT.render.esc(f.name)}</span>`).join('');
    });
    document.getElementById('submit-form').addEventListener('submit', e => {
      e.preventDefault();
      const fields = Object.fromEntries(new FormData(e.target).entries());
      fields.attachments = this.pendingFiles;
      const t = TKT.data.submitTicket(fields);
      TKT.state.lastTicketNumber = t.ticket_number;
      TKT.app.showView('success');
    });
  },
};
