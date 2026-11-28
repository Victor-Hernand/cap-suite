export function onEscape(ownerDocument, handler) {
  const onKeydown = (event) => {
    if (event.key === 'Escape') handler(event);
  };
  ownerDocument.addEventListener('keydown', onKeydown);
  return () => ownerDocument.removeEventListener('keydown', onKeydown);
}
