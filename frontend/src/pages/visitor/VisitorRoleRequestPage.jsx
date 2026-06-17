import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios.js';
import LanguageSwitcher from '../../components/layout/LanguageSwitcher.jsx';
import PageFrame from '../../components/layout/PageFrame.jsx';
import { useAuthStore, getRoleFromToken } from '../../store/authStore.js';

export default function VisitorRoleRequestPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { role: storeRole } = useAuthStore();
  const storedToken = localStorage.getItem('auth_token');
  const effectiveRole = storeRole || (storedToken ? getRoleFromToken(storedToken) : null);

  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('student');
  const [reason, setReason] = useState('');
  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // Load current user's requests
  useEffect(() => {
    if (effectiveRole !== 'visitor') {
      navigate('/account');
      return;
    }
    loadMyRequests();
  }, [effectiveRole, navigate]);

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

      setMessage('✓ Request submitted successfully! An administrator will review your request shortly.');
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

  const pendingRequest = myRequests.find((r) => r.status === 'pending');

  return (
    <PageFrame
      title="Welcome to USV Events"
      subtitle="You're currently a visitor. Request access to join as a student or organizer."
      actions={<LanguageSwitcher />}
      contentClassName="space-y-8"
    >
      <div className="max-w-4xl mx-auto">

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Request form section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-blue-500 px-6 py-8">
                <h2 className="text-2xl font-bold text-white">Request Role Upgrade</h2>
                <p className="text-indigo-100 mt-1">
                  Choose the role that best fits your needs
                </p>
              </div>

              <div className="p-6 space-y-6">
                {message && (
                  <div
                    className={`p-4 rounded-lg ${
                      messageType === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : messageType === 'error'
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {message}
                  </div>
                )}

                {pendingRequest ? (
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-5">
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">⏳</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-amber-900 text-lg">
                          Request Pending Review
                        </h3>
                        <p className="text-amber-700 mt-1">
                          Your request for <span className="font-semibold capitalize">{pendingRequest.requested_role}</span> role
                          is currently being reviewed by an administrator.
                        </p>
                        <p className="text-sm text-amber-600 mt-2">
                          Submitted on: {new Date(pendingRequest.created_at).toLocaleDateString()}
                        </p>
                        {pendingRequest.reason && (
                          <p className="text-sm text-amber-700 mt-3 p-3 bg-amber-100 rounded">
                            <span className="font-semibold">Your reason:</span> {pendingRequest.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Role selection */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-3">
                        Which role do you want?
                      </label>
                      <div className="space-y-3">
                        <label className="flex items-start p-4 border-2 border-slate-200 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition"
                          style={selectedRole === 'student' ? { borderColor: '#4f46e5', backgroundColor: '#eef2ff' } : {}}
                        >
                          <input
                            type="radio"
                            value="student"
                            checked={selectedRole === 'student'}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="mt-1 h-5 w-5 text-indigo-600 cursor-pointer"
                          />
                          <div className="ml-3 flex-1">
                            <p className="font-semibold text-slate-900">Student</p>
                            <p className="text-sm text-slate-600 mt-1">
                              Attend events, join communities, access materials, and earn certificates
                            </p>
                          </div>
                        </label>

                        <label className="flex items-start p-4 border-2 border-slate-200 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition"
                          style={selectedRole === 'organizer' ? { borderColor: '#4f46e5', backgroundColor: '#eef2ff' } : {}}
                        >
                          <input
                            type="radio"
                            value="organizer"
                            checked={selectedRole === 'organizer'}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="mt-1 h-5 w-5 text-indigo-600 cursor-pointer"
                          />
                          <div className="ml-3 flex-1">
                            <p className="font-semibold text-slate-900">Organizer</p>
                            <p className="text-sm text-slate-600 mt-1">
                              Create events, manage participants, upload materials, and track attendance
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Reason textarea */}
                    <div>
                      <label htmlFor="reason" className="block text-sm font-semibold text-slate-900 mb-2">
                        Why do you want this role? <span className="text-slate-400">(optional)</span>
                      </label>
                      <textarea
                        id="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Tell us about your interests or plans..."
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                        rows="4"
                        maxLength="1000"
                      />
                      <p className="text-xs text-slate-500 mt-2 text-right">
                        {reason.length}/1000 characters
                      </p>
                    </div>

                    {/* Submit button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="inline-block animate-spin">⏳</span> Submitting...
                        </span>
                      ) : (
                        'Submit Request'
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Info sidebar */}
          <div className="space-y-4">
            {/* What happens next */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                <span className="text-lg">📋</span> What Happens Next
              </h3>
              <ol className="text-sm text-blue-800 mt-3 space-y-2">
                <li className="flex gap-2">
                  <span className="font-bold">1.</span>
                  <span>Your request is submitted to administrators</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">2.</span>
                  <span>We review your information within 24 hours</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">3.</span>
                  <span>You'll receive an email with the decision</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">4.</span>
                  <span>Your role will be activated immediately</span>
                </li>
              </ol>
            </div>

            {/* Tips */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <h3 className="font-semibold text-green-900 flex items-center gap-2">
                <span className="text-lg">💡</span> Tips
              </h3>
              <ul className="text-sm text-green-800 mt-3 space-y-2">
                <li>✓ Use your real name in your profile</li>
                <li>✓ Provide a reason if possible</li>
                <li>✓ Check your email for updates</li>
              </ul>
            </div>

            {/* Request history */}
            {!loadingRequests && myRequests.length > 1 && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <h3 className="font-semibold text-slate-900">Request History</h3>
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                  {myRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-medium capitalize">{req.requested_role}</span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            req.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : req.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {req.status === 'pending'
                            ? '⏳ Pending'
                            : req.status === 'approved'
                            ? '✓ Approved'
                            : '✗ Rejected'}
                        </span>
                      </div>
                      <p className="text-slate-500 mt-1">
                        {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FAQ section */}
        <div className="mt-12 bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-100 to-slate-50 px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Frequently Asked Questions</h2>
          </div>
          <div className="p-6 space-y-4">
            <details className="group cursor-pointer">
              <summary className="flex items-center justify-between font-semibold text-slate-900 hover:text-indigo-600">
                What's the difference between Student and Organizer?
                <span className="transition group-open:rotate-180">▼</span>
              </summary>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                <strong>Students</strong> can register for events, view materials, submit feedback, and download certificates. 
                <strong>Organizers</strong> can create events, manage registrations, upload materials, and view attendance statistics.
              </p>
            </details>

            <details className="group cursor-pointer">
              <summary className="flex items-center justify-between font-semibold text-slate-900 hover:text-indigo-600">
                How long does approval take?
                <span className="transition group-open:rotate-180">▼</span>
              </summary>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                We typically review requests within 24 hours. You'll receive an email notification once your request has been reviewed.
              </p>
            </details>

            <details className="group cursor-pointer">
              <summary className="flex items-center justify-between font-semibold text-slate-900 hover:text-indigo-600">
                Can I request both roles?
                <span className="transition group-open:rotate-180">▼</span>
              </summary>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                You can submit separate requests for each role. Depending on your needs, you might be approved for both roles.
              </p>
            </details>

            <details className="group cursor-pointer">
              <summary className="flex items-center justify-between font-semibold text-slate-900 hover:text-indigo-600">
                What if my request is rejected?
                <span className="transition group-open:rotate-180">▼</span>
              </summary>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                If rejected, you'll receive feedback on why. You can update your profile and request again after addressing the feedback.
              </p>
            </details>
          </div>
        </div>
      </div>
    </PageFrame>
  );
}
