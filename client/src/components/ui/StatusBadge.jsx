const StatusBadge = ({ status }) => {
  const config = {
    'In Stock':   'badge-green',
    'Low Stock':  'badge-amber',
    'Out of Stock': 'badge-red',
    'Active':     'badge-green',
    'Inactive':   'badge-gray',
    'Deployed':   'badge-yellow',
    'approved':   'badge-green',
    'Approved':   'badge-green',
    'submitted':  'badge-blue',
    'Submitted':  'badge-blue',
    'draft':      'badge-gray',
    'Draft':      'badge-gray',
    'pending':    'badge-amber',
    'Pending':    'badge-amber',
    'rejected':   'badge-red',
    'Rejected':   'badge-red',
    'published':  'badge-green',
    'Published':  'badge-green',
    'Within Budget': 'badge-green',
    'Over Budget':   'badge-red',
    'Available':     'badge-green',
    'Sufficient':    'badge-green',
    'Shortage':      'badge-red',
    'Low After Use': 'badge-amber',
    'Delivered':     'badge-green',
  };
  return (
    <span className={config[status] || 'badge-gray'}>
      {status}
    </span>
  );
};

export default StatusBadge;
