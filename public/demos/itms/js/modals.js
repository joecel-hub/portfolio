window.ITMS = window.ITMS || {};

ITMS.modals = (function () {
  const root = () => document.getElementById('modal-root');

  function open({ title, body, wide }) {
    close();
    root().innerHTML = `
      <div class="itms-modal-overlay" id="itms-modal-overlay" role="dialog" aria-modal="true" aria-label="${ITMS.render.esc(title)}">
        <div class="itms-modal${wide ? ' wide' : ''}">
          <div class="itms-modal-head"><h3>${ITMS.render.esc(title)}</h3><button type="button" id="itms-modal-close" aria-label="Close">&times;</button></div>
          <div class="itms-modal-body">${body}</div>
        </div>
      </div>`;
    document.getElementById('itms-modal-overlay').addEventListener('click', e => {
      if (e.target.id === 'itms-modal-overlay') close();
    });
    document.getElementById('itms-modal-close').addEventListener('click', close);
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
