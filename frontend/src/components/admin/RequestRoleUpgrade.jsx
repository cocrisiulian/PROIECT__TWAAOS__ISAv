import React, { useState, useEffect } from 'react';
import api from '../../api/axios.js';
import { useAuthStore, getRoleFromToken } from '../../store/authStore.js';

function RequestRoleUpgrade() {
  const { role } = useAuthStore();
  const storedToken = localStorage.getItem('auth_token');
  const effectiveRole = role || (storedToken ? getRoleFromToken(storedToken) : null);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('student');
  const [reason, setReason] = useState('');
  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success', 'error', 'info'

  // Load current user's requests
  useEffect(() => {
    loadMyRequests();
  }, []);

  const loadMyRequests = async () => {
    try {
      setLoadingRequests(true);
      const { data } = await api.get('/account/role-upgrade-requests');
      setMyRequests(data || []);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedRole) {
      setMessage('Please select a role');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { data } = await api.post('/account/role-upgrade-request', {
        requested_role: selectedRole,
        reason: reason || null,
      });

      setMessage('✓ Request submitted successfully. Please wait for admin approval.');
      setMessageType('success');
      setReason('');
      setSelectedRole('student');
      
      // Refresh requests list
      await loadMyRequests();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to submit request';
      setMessage(errorMsg);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  if (effectiveRole !== 'visitor') {
    return null;
  }

  const pendingRequest = myRequests.find(r => r.status === 'pending');

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
      <div className="max-w-2xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Upgrade Your Account
        </h3>
        <p className="text-gray-600 mb-6">
          Currently you have a visitor role. You can request access to join as a student or organizer.
          An administrator will review your request and notify you of the decision.
        </p>

        {message && (
          <div className={`p-3 rounded-md mb-6 ${
            messageType === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
            messageType === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
            'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            {message}
          </div>
        )}

        {pendingRequest ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 font-medium mb-2">
              ⏳ You have a pending role upgrade request
            </p>
            <p className="text-yellow-700 text-sm mb-3">
              Requested role: <span className="font-semibold capitalize">{pendingRequest.requested_role}</span>
            </p>
            {pendingRequest.reason && (
              <p className="text-yellow-700 text-sm mb-3">
                Your reason: {pendingRequest.reason}
              </p>
            )}
            <p className="text-yellow-700 text-sm">
              Submitted: {new Date(pendingRequest.created_at).toLocaleDateString()}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role you want to request
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="student"
                    checked={selectedRole === 'student'}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="h-4 w-4 text-indigo-600 cursor-pointer"
                  />
                  <span className="ml-3 text-sm text-gray-700 cursor-pointer">
                    Student - Attend events and participate
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="organizer"
                    checked={selectedRole === 'organizer'}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="h-4 w-4 text-indigo-600 cursor-pointer"
                  />
                  <span className="ml-3 text-sm text-gray-700 cursor-pointer">
                    Organizer - Create and manage events
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                Why do you want this role? <span className="text-gray-500">(optional)</span>
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Tell us why you'd like to have this role..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows="3"
                maxLength="1000"
              />
              <p className="text-xs text-gray-500 mt-1">{reason.length}/1000</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        )}

        {myRequests.length > 0 && (
          <div className="mt-6 pt-6 border-t border-blue-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Your Request History</h4>
            <div className="space-y-2">
              {myRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-3 bg-white border border-gray-200 rounded-md text-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {req.requested_role}
                      </p>
                      <p className="text-gray-600 text-xs mt-1">
                        {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      req.status === 'approved' ? 'bg-green-100 text-green-800' :
                      req.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {req.status === 'pending' ? '⏳ Pending' :
                       req.status === 'approved' ? '✓ Approved' :
                       '✗ Rejected'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RequestRoleUpgrade;
