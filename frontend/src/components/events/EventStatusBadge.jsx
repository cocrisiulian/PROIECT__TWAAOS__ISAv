import { useTranslation } from 'react-i18next';

const STATUS_CONFIG = {
  draft: { labelKey: 'events.statusBadge.draft', classes: 'bg-gray-100 text-gray-700' },
  pending_approval: { labelKey: 'events.statusBadge.pending_approval', classes: 'bg-yellow-100 text-yellow-800' },
  published: { labelKey: 'events.statusBadge.published', classes: 'bg-green-100 text-green-700' },
  rejected: { labelKey: 'events.statusBadge.rejected', classes: 'bg-red-100 text-red-700' },
  cancelled: { labelKey: 'events.statusBadge.cancelled', classes: 'bg-gray-200 text-gray-500 line-through' },
};

function EventStatusBadge({ status }) {
  const { t } = useTranslation();
  const config = STATUS_CONFIG[status] || { labelKey: 'events.statusBadge.unknown', classes: 'bg-gray-100 text-gray-600' };
  const label = t(config.labelKey);

  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${config.classes}`}>
      {label}
    </span>
  );
}

export default EventStatusBadge;
