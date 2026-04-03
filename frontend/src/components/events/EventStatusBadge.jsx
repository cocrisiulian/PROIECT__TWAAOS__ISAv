const STATUS_CONFIG = {
  draft: { label: 'Draft', classes: 'bg-gray-100 text-gray-700' },
  pending_approval: { label: 'Pending Approval', classes: 'bg-yellow-100 text-yellow-800' },
  published: { label: 'Published', classes: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', classes: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelled', classes: 'bg-gray-200 text-gray-500 line-through' },
};

function EventStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, classes: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${config.classes}`}>
      {config.label}
    </span>
  );
}

export default EventStatusBadge;
