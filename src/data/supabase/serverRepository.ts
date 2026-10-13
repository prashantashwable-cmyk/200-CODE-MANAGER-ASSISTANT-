/**
 * The repository with the parts that have moved onto the server (S1: who may sign in, and Admin's decision on people
 * waiting for a role). Everything else is still the in-memory repository underneath; each later slice moves another
 * module here, one method at a time, coded against the same `Repository` interface the screens use.
 */
import { RepositoryError } from '@/data/repository';
import type { Repository } from '@/data/repository';
import type { Role, SignInRequest } from '@/data/types';
import { supabase } from './client';

interface PendingRow {
  id: string;
  phone: string;
  name: string;
  requested_role: Role | null;
  created_at: string;
}

export function withServer(base: Repository): Repository {
  return {
    ...base,

    // Row-level security returns these only to a signed-in, active Admin (of the same world, real or demo).
    listSignInRequests: async () => {
      const { data, error } = await supabase()
        .from('profiles')
        .select('id, phone, name, requested_role, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .returns<PendingRow[]>();
      if (error) throw new RepositoryError('network');
      return (data ?? []).map<SignInRequest>((r) => ({
        id: r.id,
        phone: r.phone,
        name: r.name,
        requestedRole: r.requested_role,
        waitingSince: r.created_at,
      }));
    },

    decideSignInRequest: async (requestId, input) => {
      if (input.approve && !input.role) throw new RepositoryError('role_required');
      const note = input.note?.trim() || null;
      const patch = input.approve
        ? { role: input.role, status: 'active', decision_note: note }
        : { status: 'rejected', decision_note: note };
      // Only while it is still waiting: if another Admin answered first, nothing changes and we say so.
      const { data, error } = await supabase().from('profiles').update(patch).eq('id', requestId).eq('status', 'pending').select('id');
      if (error) throw new RepositoryError(/last_admin|forbidden_field/.exec(error.message)?.[0] ?? 'network');
      if (!data || data.length === 0) throw new RepositoryError('not_pending');
    },
  };
}
