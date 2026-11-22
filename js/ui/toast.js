const host = () => document.getElementById('toasts');

/** Brief message with optional action (e.g. Undo). Returns a dismiss function. */
export function toast(message, { action, onAction, ms = 3800 } = {}) {
  const el = document.createElement('div');
  el.className = 'toast';
  const span = document.createElement('span');
  span.textContent = message;
  el.appendChild(span);
  let t = 0;
  const close = () => {
    clearTimeout(t);
    if (!el.isConnected) return;
    el.classList.add('out');
    setTimeout(() => el.remove(), 170);
  };
  if (action) {
    const b = document.createElement('button');
    b.textContent = action;
    b.onclick = () => {
      onAction && onAction();
      close();
    };
    el.appendChild(b);
  }
  const h = host();
  while (h.children.length > 2) h.firstElementChild.remove();
  h.appendChild(el);
  t = setTimeout(close, ms);
  return close;
}
