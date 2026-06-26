const StatusBadge = ({ status }) => {
  const config = {
    'In Stock':   'badge-green',
    'Low Stock':  'badge-amber',
    'Out of Stock': 'badge-red',
    'Active':     'badge-green',
    'Inactive':   'badge-gray',
    'Deployed':   'badge-yellow',
    'approved':   'badge-green',
    'submitted':  'badge-blue',
    'draft':      'badge-gray',
    'pending':    'badge-amber',
    'rejected':   'badge-red',
    'published':  'badge-green',
    'Within Budget': 'badge-green',
    'Over Budget':   'badge-red',
    'Pending':       'badge-amber',
  };
  return (
    <span className={config[status] || 'badge-gray'}>
      {status}
    </span>
  );
};

export default StatusBadge;
