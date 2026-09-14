window.TKT = window.TKT || {};

TKT.modals = (function () {
  const root = () => document.getElementById('modal-root');

  function open({ title, body, wide }) {
    close();
    root().innerHTML = `
      <div class="tkt-modal-overlay" id="tkt-modal-overlay" role="dialog" aria-modal="true" aria-label="${TKT.render.esc(title)}">
        <div class="tkt-modal${wide ? ' wide' : ''}">
          <div class="tkt-modal-head"><h3>${TKT.render.esc(title)}</h3><button type="button" id="tkt-modal-close" aria-label="Close">&times;</button></div>
          <div class="tkt-modal-body">${body}</div>
        </div>
      </div>`;
    document.getElementById('tkt-modal-overlay').addEventListener('click', e => {
      if (e.target.id === 'tkt-modal-overlay') close();
    });
    document.getElementById('tkt-modal-close').addEventListener('click', close);
    const first = root().querySelector('input, select, textarea');
    if (first) first.focus();
  }

  function close() {
    const r = root();
    if (r) r.innerHTML = '';
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') close();
  });

  return { open, close };
})();
