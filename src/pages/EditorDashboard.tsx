import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { editorService } from '../services/editorService';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '../hooks/useToast';

const EditorDashboard: React.FC = () => {
  const { state: authState } = useAuth();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionEventId, setActionEventId] = useState<string | null>(null);

  const isOCMember = authState.user?.role === 'admin' || authState.user?.role === 'co-admin';

  useEffect(() => {
    if (!isOCMember) return;
    loadDashboardData();
  }, [isOCMember]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const submissionsData = await editorService.getPendingSubmissions();
      setPendingSubmissions(submissionsData);
    } catch (e) {
      setError('Failed to load pending events');
      console.error('Dashboard load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveEvent = async (eventId: string) => {
    if (actionEventId) return;
    setActionEventId(eventId);
    try {
      await editorService.approveEvent(eventId);
      setPendingSubmissions(prev => prev.filter(event => event.id !== eventId));
      showSuccess('Event approved successfully');
    } catch (e) {
      showError('Failed to approve event');
    } finally {
      setActionEventId(null);
    }
  };

  const handleRejectEvent = async (eventId: string) => {
    if (actionEventId) return;
    const reason = prompt('Please provide a reason for rejection (optional):');
    if (reason === null) return; // User cancelled prompt
    setActionEventId(eventId);
    try {
      await editorService.rejectEvent(eventId, reason || undefined);
      setPendingSubmissions(prev => prev.filter(event => event.id !== eventId));
      showSuccess('Event rejected successfully');
    } catch (e) {
      showError('Failed to reject event');
    } finally {
      setActionEventId(null);
    }
  };

  if (!authState.isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center text-gray-400">Sign in as an admin or co-admin to continue.</div>
      </div>
    );
  }

  if (!isOCMember) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center text-gray-400">You do not have access to the OC Review Portal.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Mobile View */}
      <div className="md:hidden px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">OC Review Portal</h1>
          <p className="text-gray-400 text-sm">Review pending event submissions.</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-dark-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {pendingSubmissions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No pending events to review.</p>
            ) : pendingSubmissions.map(event => (
              <div key={event.id} className="bg-dark-900 border border-dark-800 rounded-xl p-4">
                <div className="flex flex-col mb-4">
                  <h3 className="font-semibold text-white mb-1">{event.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="font-medium text-gray-300">{event.submitter.name}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 space-y-1">
                    <p><span className="font-bold text-gray-400 uppercase tracking-widest w-12 inline-block">DATE</span> {new Date(event.event_date).toLocaleString()}</p>
                    <p><span className="font-bold text-gray-400 uppercase tracking-widest w-12 inline-block">VENUE</span> {event.venue}</p>
                  </div>
                </div>
                <div className="flex justify-between gap-2 border-t border-dark-800 pt-3">
                  <button onClick={() => handleApproveEvent(event.id)} disabled={actionEventId === event.id} className="flex-1 py-2 bg-green-900/20 border border-green-900/30 text-green-400 hover:bg-green-900/30 rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed">
                    {actionEventId === event.id ? 'PROCESSING...' : 'APPROVE EVENT'}
                  </button>
                  <button onClick={() => handleRejectEvent(event.id)} disabled={actionEventId === event.id} className="flex-1 py-2 bg-red-900/20 border border-red-900/30 text-red-400 hover:bg-red-900/30 rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed">
                    {actionEventId === event.id ? 'PROCESSING...' : 'REJECT'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 border-b border-dark-800 pb-6">
            <h1 className="text-3xl font-bold text-white mb-2">OC Review Portal</h1>
            <p className="text-gray-400">Review and approve pending event submissions.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-dark-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden shadow-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-dark-900 border-b border-dark-700">
                    <th className="p-5 font-bold uppercase tracking-wider text-gray-400 text-xs w-2/5">Event Details</th>
                    <th className="p-5 font-bold uppercase tracking-wider text-gray-400 text-xs w-1/5">Submitter</th>
                    <th className="p-5 font-bold uppercase tracking-wider text-gray-400 text-xs w-1/5">Submitted</th>
                    <th className="p-5 font-bold uppercase tracking-wider text-gray-400 text-xs w-1/5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingSubmissions.map(event => (
                    <tr key={event.id} className="border-b border-dark-700/50 hover:bg-dark-700/30 transition-colors">
                      <td className="p-5">
                        <p className="font-semibold text-white text-lg mb-1">{event.title}</p>
                        <div className="flex flex-col gap-1 text-sm text-gray-400 mt-2">
                          <span className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 w-12">DATE</span>
                            <span className="text-gray-300">{new Date(event.event_date).toLocaleString()}</span>
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 w-12">VENUE</span>
                            <span className="text-gray-300">{event.venue}</span>
                          </span>
                        </div>
                      </td>
                      <td className="p-5">
                        <span className="inline-block px-3 py-1 bg-dark-900 border border-dark-700 rounded-lg text-sm text-gray-300 font-medium">
                          {event.submitter.name}
                        </span>
                      </td>
                      <td className="p-5 text-gray-400 text-sm">
                        {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                      </td>
                      <td className="p-5 text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => handleApproveEvent(event.id)}
                            disabled={actionEventId === event.id}
                            className="px-4 py-2 bg-green-900/20 text-green-400 border border-green-900/30 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-green-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionEventId === event.id ? 'PROCESSING...' : 'APPROVE EVENT'}
                          </button>
                          <button
                            onClick={() => handleRejectEvent(event.id)}
                            disabled={actionEventId === event.id}
                            className="px-4 py-2 bg-red-900/20 text-red-400 border border-red-900/30 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionEventId === event.id ? 'PROCESSING...' : 'REJECT'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pendingSubmissions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-16 text-center text-gray-500">
                        <div className="flex justify-center mb-4">
                          <span className="text-4xl">📋</span>
                        </div>
                        <p className="text-lg font-medium text-gray-400 mb-1">All Caught Up</p>
                        <p className="text-sm">No pending events require review at this time.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditorDashboard;
