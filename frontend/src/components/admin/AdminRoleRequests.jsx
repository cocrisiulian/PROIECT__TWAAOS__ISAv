import React, { useState, useEffect } from 'react';
import api from '../../api/axios.js';

function AdminRoleRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage] = useState(10);
  const [processingId, setProcessingId] = useState(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [showReasonForm, setShowReasonForm] = useState(null);
  const [statusCounts, setStatusCounts] = useState({ all: 0, pending: 0, approved: 0, rejected: 0 });

  // Load status counts on mount
  useEffect(() => {
    const loadStatusCounts = async () => {
      const counts = { all: 0, pending: 0, approved: 0, rejected: 0 };
      
      try {
        // Get total count (all statuses)
        const allData = await api.get('/admin/role-requests', { params: { per_page: 1 } });
        counts.all = allData.data.total || 0;
      } catch (error) {
        console.error('Failed to get total count:', error);
      }
      
      // Get counts for each specific status
      for (const status of ['pending', 'approved', 'rejected']) {
        try {
          const statusData = await api.get('/admin/role-requests', { 
            params: { per_page: 1, status } 
          });
          counts[status] = statusData.data.total || 0;
        } catch (error) {
          console.error(`Failed to get ${status} count:`, error);
        }
      }
      
      setStatusCounts(counts);
    };
    
    loadStatusCounts();
  }, []);
  const loadRequests = async (pageNum = 1) => {
    try {
      setLoading(true);
      const params = {
        page: pageNum,
        per_page: perPage,
      };
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const { data } = await api.get('/admin/role-requests', { params });
      setRequests(data.requests || []);
      setTotal(data.total || 0);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to load requests:', error);
      alert('Failed to load role upgrade requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests(1);
  }, [statusFilter]);

  const handleApprove = async (requestId) => {
    setProcessingId(requestId);
    try {
      await api.post(`/admin/role-requests/${requestId}/approve`, {
        decision_reason: decisionReason,
      });
      alert('✓ Request approved! User role has been updated.');
      setDecisionReason('');
      setShowReasonForm(null);
      // Update counts
      setStatusCounts(prev => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1),
        approved: prev.approved + 1,
      }));
      await loadRequests(page);
    } catch (error) {
      alert('Failed to approve request: ' + (error.response?.data?.detail || error.message));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId) => {
    if (!decisionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    setProcessingId(requestId);
    try {
      await api.post(`/admin/role-requests/${requestId}/reject`, {
        decision_reason: decisionReason,
      });
      alert('✓ Request rejected! User has been notified.');
      setDecisionReason('');
      setShowReasonForm(null);
      // Update counts
      setStatusCounts(prev => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1),
        rejected: prev.rejected + 1,
      }));
      await loadRequests(page);
    } catch (error) {
      alert('Failed to reject request: ' + (error.response?.data?.detail || error.message));
    } finally {
      setProcessingId(null);
    }
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Role Upgrade Requests</h2>
        <div className="gap-2 flex">
          {['all', 'pending', 'approved', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                statusFilter === s
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}
            >
              {s === 'all' ? `All (${statusCounts.all})` : s === 'pending' ? `⏳ Pending (${statusCounts.pending})` : s === 'approved' ? `✓ Approved (${statusCounts.approved})` : `✗ Rejected (${statusCounts.rejected})`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <p className="text-gray-500">Loading requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-10 text-center">
          <p className="text-gray-600">No role upgrade requests found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition"
            >
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">User</p>
                  <p className="font-medium text-gray-900">{request.user_full_name}</p>
                  <p className="text-sm text-gray-600">{request.user_email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Requested Role</p>
                  <p className="font-medium text-indigo-600 capitalize">{request.requested_role}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    request.status === 'approved' ? 'bg-green-100 text-green-800' :
                    request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {request.status === 'pending' ? '⏳ Pending' :
                     request.status === 'approved' ? '✓ Approved' :
                     '✗ Rejected'}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Requested</p>
                  <p className="text-sm text-gray-600">
                    {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {request.reason && (
                <div className="mb-4 p-3 bg-gray-50 rounded-md border-l-4 border-indigo-500">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Reason</p>
                  <p className="text-sm text-gray-700">{request.reason}</p>
                </div>
              )}

              {request.decision_reason && (
                <div className={`mb-4 p-3 rounded-md border-l-4 ${
                  request.status === 'approved' 
                    ? 'bg-green-50 border-green-500' 
                    : 'bg-red-50 border-red-500'
                }`}>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Admin Decision</p>
                  <p className={`text-sm ${
                    request.status === 'approved' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {request.decision_reason}
                  </p>
                </div>
              )}

              {request.status === 'pending' && (
                <div className="flex gap-3">
                  {showReasonForm === request.id ? (
                    <div className="flex-1 space-y-2">
                      <textarea
                        value={decisionReason}
                        onChange={(e) => setDecisionReason(e.target.value)}
                        placeholder="Enter reason (optional for approval, required for rejection)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        rows="2"
                        maxLength="500"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(request.id)}
                          disabled={processingId === request.id}
                          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
                        >
                          {processingId === request.id ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          disabled={processingId === request.id}
                          className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition"
                        >
                          {processingId === request.id ? 'Processing...' : 'Reject'}
                        </button>
                        <button
                          onClick={() => {
                            setShowReasonForm(null);
                            setDecisionReason('');
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setShowReasonForm(request.id);
                        setDecisionReason('');
                      }}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition"
                    >
                      Review & Make Decision
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => loadRequests(page - 1)}
                disabled={page === 1}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => loadRequests(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminRoleRequests;
