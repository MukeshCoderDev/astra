import { TipNotificationOverlay } from './TipNotificationOverlay';
import { useTipNotifications } from '../../hooks/useTipNotifications';

export function GlobalNotifications() {
  const { notifications, removeNotification } = useTipNotifications();

  return (
    <TipNotificationOverlay
      notifications={notifications}
      onDismiss={removeNotification}
    />
  );
}