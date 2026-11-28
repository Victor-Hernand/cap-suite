export function bindPasswordToggle(button) {
  const toggle = () => {
    const input = button.ownerDocument.getElementById(button.getAttribute('aria-controls'));
    if (!input) return;
    const revealing = input.type === 'password';
    input.type = revealing ? 'text' : 'password';
    button.setAttribute('aria-label', revealing ? 'Ocultar contraseña' : 'Mostrar contraseña');
    const icon = button.querySelector('.mdi');
    icon?.classList.toggle('mdi-eye-outline', !revealing);
    icon?.classList.toggle('mdi-eye-off-outline', revealing);
  };
  button.addEventListener('click', toggle);
  return () => button.removeEventListener('click', toggle);
}
