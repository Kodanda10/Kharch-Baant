import React, { useEffect, useState } from 'react';
import { getPendingDeletionRequests, approveGroupDeletion, rejectGroupDeletion } from '../services/supabaseApiService';
import type { Group, Person } from '../types';
import Avatar from './Avatar';
import toast from 'react-hot-toast';

interface DeletionRequest {
  id: string;
  group_id: string;
  requested_by: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  group?: Group;
  requester?: Person;
}

interface AdminDeletionRequestsPanelProps {
  currentUserId: string;
  onRequestProcessed?: () => void;
}

const AdminDeletionRequestsPanel: React.FC<AdminDeletionRequestsPanelProps> = ({
  currentUserId,
  onRequestProcessed,
}) => {
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await getPendingDeletionRequests(currentUserId);
      setRequests(data);
    } catch (error) {
      console.error('Failed to load deletion requests:', error);
      toast.error('Failed to load deletion requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [currentUserId]);

  const handleApprove = async (requestId: string, groupName: string, allSettled: boolean) => {
    if (!window.confirm(`Approve deletion of "${groupName}"? This will permanently delete the group.`)) {
      return;
    }

    try {
      setProcessing(requestId);
      await approveGroupDeletion(requestId, currentUserId, allSettled);
      toast.success(`Group "${groupName}" deleted successfully`);
      await loadRequests();
      onRequestProcessed?.();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to approve deletion');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string, groupName: string) => {
    if (!window.confirm(`Reject deletion request for "${groupName}"?`)) {
      return;
    }

    try {
      setProcessing(requestId);
      await rejectGroupDeletion(requestId);
      toast.success('Deletion request rejected');
      await loadRequests();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to reject request');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-4 bg-black/20 rounded-lg border border-white/10">
        <h3 className="text-sm font-medium text-slate-300">Deletion Requests</h3>
        <div className="text-xs text-slate-400">Loading...</div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col gap-2 p-4 bg-black/20 rounded-lg border border-white/10">
        <h3 className="text-sm font-medium text-slate-300">Deletion Requests</h3>
        <div className="text-xs text-slate-400">No pending deletion requests.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 bg-black/20 rounded-lg border border-white/10">
      <h3 className="text-sm font-medium text-slate-300">
        Deletion Requests ({requests.length})
      </h3>
      <div className="space-y-2">
        {requests.map((req) => (
          <div
            key={req.id}
            className="flex flex-col gap-2 p-3 bg-black/30 rounded-md border border-white/5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {req.group?.name || 'Unknown Group'}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {req.requester && (
                    <div className="flex items-center gap-1">
                      <Avatar
                        id={req.requester.id}
                        name={req.requester.name}
                        avatarUrl={req.requester.avatarUrl}
                        size="xs"
                      />
                      <span className="text-xs text-slate-400">{req.requester.name}</span>
                    </div>
                  )}
                  <span className="text-xs text-slate-500">
                    {new Date(req.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(req.id, req.group?.name || 'this group', true)}
                disabled={processing === req.id}
                className="flex-1 px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs rounded-md font-medium"
              >
                {processing === req.id ? 'Processing...' : 'Approve'}
              </button>
              <button
                onClick={() => handleReject(req.id, req.group?.name || 'this group')}
                disabled={processing === req.id}
                className="flex-1 px-3 py-1.5 bg-rose-600/80 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs rounded-md font-medium"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDeletionRequestsPanel;
