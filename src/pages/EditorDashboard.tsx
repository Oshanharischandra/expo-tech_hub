import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { editorService } from '../services/editorService';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '../hooks/useToast';
import supabase from '../services/supabaseClient';

const EditorDashboard: React.FC = () => {
  const { state: authState } = useAuth();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionEventId, setActionEventId] = useState<string | null>(null);
  const [confirmingAction, setConfirmingAction] = useState<{ eventId: string, type: 'approve' | 'reject' } | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      setIsAuthLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.log("Debug - User ID:", undefined, "Role:", undefined, "Error:", "No user found");
          setIsAuthLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        console.log("Debug - User ID:", user?.id, "Role:", data?.role, "Error:", error);
        
        if (error) throw error;
        setRole(data?.role || null);
        
        if (data?.role === 'admin' || data?.role === 'co-admin') {
          loadDashboardData();
        }
      } catch (e: any) {
        setAuthError(e.message || 'Authentication error');
        console.error('Access check failed:', e);
      } finally {
        setIsAuthLoading(false);
      }
    };

    checkAccess();
  }, []);

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

  const initiateApprove = (eventId: string) => setConfirmingAction({ eventId, type: 'approve' });
  const initiateReject = (eventId: string) => setConfirmingAction({ eventId, type: 'reject' });
  const cancelConfirm = () => setConfirmingAction(null);

  const confirmAction = async () => {
    if (!confirmingAction) return;
    const { eventId, type } = confirmingAction;
    
    if (actionEventId) return;
    setActionEventId(eventId);
    
    try {
      if (type === 'approve') {
        await editorService.approveEvent(eventId);
        setPendingSubmissions(prev => prev.filter(event => event.id !== eventId));
        showSuccess('Event approved successfully');
      } else {
        const reason = prompt('Please provide a reason for rejection (optional):');
        if (reason === null) {
          setActionEventId(null);
          return;
        }
        await editorService.rejectEvent(eventId, reason || undefined);
        setPendingSubmissions(prev => prev.filter(event => event.id !== eventId));
        showSuccess('Event rejected successfully');
      }
    } catch (e) {
      showError(`Failed to ${type} event`);
    } finally {
      setActionEventId(null);
      setConfirmingAction(null);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center space-y-4">
        <div className="text-gray-400 font-medium">Authenticating OC credentials...</div>
      </div>
    );
  }

  if (authError || (role !== 'admin' && role !== 'co-admin')) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center space-y-2 p-4">
        <div className="text-red-400 font-bold text-lg mb-2">Access Denied</div>
        <div className="text-gray-400 text-center text-sm max-w-md">
          {authError ? `Error: ${authError}` : 'You do not have permission to view the OC Review Portal. This area is restricted to admin users only.'}
        </div>
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
                    <span className="font-medium text-gray-300">{event.profiles?.full_name || event.profiles?.name || 'Anonymous User'}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 space-y-1">
                    <p><span className="font-bold text-gray-400 uppercase tracking-widest w-12 inline-block">DATE</span> {new Date(event.event_date).toLocaleString()}</p>
                    <p><span className="font-bold text-gray-400 uppercase tracking-widest w-12 inline-block">VENUE</span> {event.venue}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 border-t border-dark-800 pt-3">
                  {confirmingAction?.eventId === event.id ? (
                    <div className="flex flex-col gap-2">
                      <p className="text-sm text-center text-gray-300 mb-1">
                        {confirmingAction.type === 'approve' ? 'Confirm Approval?' : 'Confirm Rejection?'}
                      </p>
                      <div className="flex gap-2">
                        <button onClick={confirmAction} disabled={actionEventId === event.id} className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed">
                          {actionEventId === event.id ? 'PROCESSING...' : 'YES, CONFIRM'}
                        </button>
                        <button onClick={cancelConfirm} disabled={actionEventId === event.id} className="flex-1 py-2 bg-dark-800 hover:bg-dark-700 text-gray-300 rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed">
                          CANCEL
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between gap-2">
                      <button onClick={() => initiateApprove(event.id)} className="flex-1 py-2 bg-green-900/20 border border-green-900/30 text-green-400 hover:bg-green-900/30 rounded-lg text-xs font-bold uppercase tracking-wider">
                        APPROVE EVENT
                      </button>
                      <button onClick={() => initiateReject(event.id)} className="flex-1 py-2 bg-red-900/20 border border-red-900/30 text-red-400 hover:bg-red-900/30 rounded-lg text-xs font-bold uppercase tracking-wider">
                        REJECT
                      </button>
                    </div>
                  )}
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
                          {event.profiles?.full_name || event.profiles?.name || 'Anonymous User'}
                        </span>
                      </td>
                      <td className="p-5 text-gray-400 text-sm">
                        {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                      </td>
                      <td className="p-5 text-right">
                        {confirmingAction?.eventId === event.id ? (
                          <div className="flex flex-col items-end gap-2">
                            <span className="text-xs text-gray-300 uppercase tracking-wider font-bold">
                              {confirmingAction.type === 'approve' ? 'Confirm Approval?' : 'Confirm Rejection?'}
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={confirmAction}
                                disabled={actionEventId === event.id}
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {actionEventId === event.id ? 'PROCESSING...' : 'YES, CONFIRM'}
                              </button>
                              <button
                                onClick={cancelConfirm}
                                disabled={actionEventId === event.id}
                                className="px-4 py-2 bg-dark-800 text-gray-300 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-dark-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                CANCEL
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => initiateApprove(event.id)}
                              className="px-4 py-2 bg-green-900/20 text-green-400 border border-green-900/30 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-green-900/40 transition-colors"
                            >
                              APPROVE EVENT
                            </button>
                            <button
                              onClick={() => initiateReject(event.id)}
                              className="px-4 py-2 bg-red-900/20 text-red-400 border border-red-900/30 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-900/40 transition-colors"
                            >
                              REJECT
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {pendingSubmissions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-16 text-center text-gray-500">
                        <div className="flex justify-center mb-4">
                          <span className="text-2xl font-bold">[ NO PENDING EVENTS ]</span>
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
