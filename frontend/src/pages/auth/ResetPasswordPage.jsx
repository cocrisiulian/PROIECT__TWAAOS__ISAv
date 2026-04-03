import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { confirmPasswordReset } from '../../api/auth.js';

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const initialToken = useMemo(() => searchParams.get('token') || '', [searchParams]);

  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token || !newPassword || !confirmPassword) {
      toast.error('Please complete all fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(token, newPassword);
      setIsDone(true);
      toast.success('Password reset successfully. You can now log in.');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Could not reset password.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Set new password</h1>
        <p className="text-sm text-gray-500 mb-6">Use the reset token to create a new password.</p>

        {isDone ? (
          <div className="p-4 rounded-lg border border-green-200 bg-green-50 text-green-800 text-sm">
            Password updated successfully. Continue to{' '}
            <Link to="/login" className="font-medium underline">
              login
            </Link>
            .
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reset token</label>
              <textarea
                rows={3}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Paste reset token"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoComplete="new-password"
                placeholder="Minimum 8 characters"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoComplete="new-password"
                placeholder="Re-enter new password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium px-6 py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Updating password...' : 'Update password'}
            </button>
          </form>
        )}

        <p className="text-sm text-gray-600 mt-6 text-center">
          Back to{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
