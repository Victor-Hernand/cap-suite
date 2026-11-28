const ITEM_SELECTOR = '.cap-notifications__item';
const GROUP_SELECTOR = '.cap-notifications__group:not([data-cap-notification-empty])';

function groupHasVisibleItem(groupLabel) {
  let sibling = groupLabel.nextElementSibling;
  while (sibling?.matches(ITEM_SELECTOR)) {
    if (!sibling.hidden) return true;
    sibling = sibling.nextElementSibling;
  }
  return false;
}

function applyFilter(panel, filter) {
  const items = [...panel.querySelectorAll(ITEM_SELECTOR)];
  for (const item of items) item.hidden = filter === 'unread' && item.dataset.unread !== 'true';
  for (const groupLabel of panel.querySelectorAll(GROUP_SELECTOR)) groupLabel.hidden = !groupHasVisibleItem(groupLabel);
  const emptyMessage = panel.querySelector('[data-cap-notification-empty]');
  if (emptyMessage) emptyMessage.hidden = filter !== 'unread' || items.some((item) => !item.hidden);
}

export function bindNotificationFilter(panel) {
  const buttons = [...panel.querySelectorAll('[data-cap-notification-filter]')];
  const onClick = (event) => {
    const selected = event.currentTarget;
    for (const button of buttons) button.setAttribute('aria-pressed', String(button === selected));
    applyFilter(panel, selected.dataset.capNotificationFilter);
  };
  buttons.forEach((button) => button.addEventListener('click', onClick));
  return () => buttons.forEach((button) => button.removeEventListener('click', onClick));
}
