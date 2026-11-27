export function bindCommandK(input) {
  const ownerDocument = input.ownerDocument;
  const onKeydown = (event) => {
    if (!(event.metaKey || event.ctrlKey) || event.key !== 'k') return;
    event.preventDefault();
    input.focus();
  };
  ownerDocument.addEventListener('keydown', onKeydown);
  return () => ownerDocument.removeEventListener('keydown', onKeydown);
}
