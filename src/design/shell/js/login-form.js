export function bindLoginForm(form) {
  const button = form.querySelector('[type="submit"]');
  if (!button) return () => {};
  const ownerWindow = form.ownerDocument.defaultView;
  const idleLabel = button.textContent;

  const setBusy = (busy) => {
    button.disabled = busy;
    button.setAttribute('aria-busy', String(busy));
    button.textContent = busy ? form.dataset.capLoginForm : idleLabel;
  };
  const onSubmit = (event) => {
    if (!event.defaultPrevented) setBusy(true);
  };
  const onPageShow = (event) => {
    if (event.persisted) setBusy(false);
  };

  form.addEventListener('submit', onSubmit);
  ownerWindow.addEventListener('pageshow', onPageShow);
  return () => {
    form.removeEventListener('submit', onSubmit);
    ownerWindow.removeEventListener('pageshow', onPageShow);
  };
}
