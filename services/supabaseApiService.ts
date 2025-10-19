// Unarchive a group (set is_archived to false)
export const unarchiveGroup = async (groupId: string): Promise<{ success: boolean }> => {
  const { error } = await supabase.from('groups').update({ is_archived: false }).eq('id', groupId);
  if (error) throw error;
  return { success: true };
};
// Delete a group (only by owner, only if all balances settled)
export const deleteGroup = async (groupId: string, userId: string, isOwner: boolean, allSettled: boolean): Promise<{ success: boolean }> => {
  if (!isOwner) throw new Error('Only the group owner can delete the group.');
  if (!allSettled) throw new Error('All balances must be settled before deleting the group.');
  // Delete group_members first (due to FK)
  await supabase.from('group_members').delete().eq('group_id', groupId);
  // Delete transactions
  await supabase.from('transactions').delete().eq('group_id', groupId);
  // Delete group
  const { error } = await supabase.from('groups').delete().eq('id', groupId);
  if (error) throw error;
  return { success: true };
};

// Archive a group (for non-owners, only if their balance is zero and all settled)
export const archiveGroup = async (groupId: string, userId: string, isOwner: boolean, userSettled: boolean, allSettled: boolean): Promise<{ success: boolean }> => {
  if (isOwner) throw new Error('Owner cannot archive, only delete.');
  if (!userSettled) throw new Error('You must settle your balance before archiving.');
  if (!allSettled) throw new Error('All balances must be settled before archiving.');
  // Mark group as archived for this user (add to archived_groups table or set is_archived for user)
  // For simplicity, set is_archived true on group (if all members archive, owner can delete)
  const { error } = await supabase.from('groups').update({ is_archived: true }).eq('id', groupId);
  if (error) throw error;
  return { success: true };
};

// Fetch archived groups for settings
export const getArchivedGroups = async (userId: string): Promise<Group[]> => {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('is_archived', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const groups = await Promise.all((data || []).map(dbGroup => transformDbGroupToAppGroup(dbGroup)));
  return groups;
};
import { supabase } from '../lib/supabase';
import { Group, Transaction, PaymentSource, Person, GroupType, SplitParticipant } from '../types';
import type { DbGroup, DbTransaction, DbPaymentSource, DbPerson } from '../lib/supabase';

// Helper function to transform database group to app group
const transformDbGroupToAppGroup = async (dbGroup: DbGroup): Promise<Group> => {
  // Get group members
  const { data: memberData, error } = await supabase
    .from('group_members')
    .select('person_id')
    .eq('group_id', dbGroup.id);

  if (error) throw error;

  return {
    id: dbGroup.id,
    name: dbGroup.name,
    currency: dbGroup.currency,
    members: memberData?.map(m => m.person_id) || [],
    groupType: dbGroup.group_type as GroupType,
    tripStartDate: dbGroup.trip_start_date || undefined,
    tripEndDate: dbGroup.trip_end_date || undefined,
    isArchived: dbGroup.is_archived || false,
    createdBy: dbGroup.created_by || undefined,
  };
};

// Helper function to transform database transaction to app transaction
const transformDbTransactionToAppTransaction = (dbTransaction: DbTransaction): Transaction => {
  const participants = (dbTransaction.split_participants as unknown as SplitParticipant[]) || [];
  return {
    id: dbTransaction.id,
    groupId: dbTransaction.group_id,
    description: dbTransaction.description,
    amount: Number(dbTransaction.amount),
    paidById: dbTransaction.paid_by_id,
    date: dbTransaction.date,
    tag: dbTransaction.tag as Transaction['tag'],
    paymentSourceId: dbTransaction.payment_source_id ?? undefined,
    comment: dbTransaction.comment ?? undefined,
    type: (dbTransaction.type as Transaction['type']) || 'expense',
    split: {
      mode: dbTransaction.split_mode as Transaction['split']['mode'],
      participants,
    },
  };
};

// Helper function to transform database payment source to app payment source
const transformDbPaymentSourceToAppPaymentSource = (dbPaymentSource: DbPaymentSource): PaymentSource => {
  return {
    id: dbPaymentSource.id,
    name: dbPaymentSource.name,
    type: dbPaymentSource.type as PaymentSource['type'],
    details: (dbPaymentSource.details as unknown as PaymentSource['details']) || undefined,
    isActive: dbPaymentSource.is_active ?? true,
  };
};

// Helper function to transform database person to app person
const transformDbPersonToAppPerson = (dbPerson: DbPerson): Person => {
  return {
    id: dbPerson.id,
    name: dbPerson.name,
    avatarUrl: dbPerson.avatar_url,
  };
};

// GROUPS API
export const getGroups = async (personId?: string): Promise<Group[]> => {
  let query = supabase
    .from('groups')
    .select('*')
    .order('created_at', { ascending: false });

  // If personId is provided, only return groups where the person is a member
  if (personId) {
    query = supabase
      .from('groups')
      .select(`
        *,
        group_members!inner(person_id)
      `)
      .eq('group_members.person_id', personId)
      .order('created_at', { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;

  // Transform each group and get its members
  const groups = await Promise.all(
    (data || []).map(dbGroup => transformDbGroupToAppGroup(dbGroup))
  );

  return groups;
};

export const addGroup = async (groupData: Omit<Group, 'id'>, personId?: string): Promise<Group> => {
  // Insert the group (without created_by for now until we add the column)
  const { data: groupResult, error: groupError } = await supabase
    .from('groups')
    .insert({
      name: groupData.name,
      currency: groupData.currency,
      group_type: groupData.groupType,
      trip_start_date: groupData.tripStartDate || null,
      trip_end_date: groupData.tripEndDate || null
    })
    .select()
    .single();

  if (groupError) throw groupError;

  // Include the creator as a member and other members
  const membersToAdd = [...groupData.members];
  if (personId && !membersToAdd.includes(personId)) {
    membersToAdd.push(personId);
  }

  // Insert group members
  if (membersToAdd.length > 0) {
    const { error: membersError } = await supabase
      .from('group_members')
      .insert(
        membersToAdd.map(memberId => ({
          group_id: groupResult.id,
          person_id: memberId,
        }))
      );

    if (membersError) throw membersError;
  }

  return await transformDbGroupToAppGroup(groupResult);
};

export const updateGroup = async (groupId: string, groupData: Omit<Group, 'id'>): Promise<Group> => {
  console.log('updateGroup called with:', { groupId, groupData });
  
  // First, test basic connectivity and check table structure
  try {
    const { data: testData, error: testError } = await supabase
      .from('groups')
      .select('*')
      .limit(1);
    console.log('Table structure test:', { testData, testError });
    if (testData && testData.length > 0) {
      console.log('Available columns:', Object.keys(testData[0]));
    }
  } catch (connError) {
    console.error('Connectivity test failed:', connError);
  }
  
  // Update the group with all fields
  const updateData: any = {
    name: groupData.name,
    currency: groupData.currency,
    group_type: groupData.groupType,
    trip_start_date: groupData.tripStartDate || null,
    trip_end_date: groupData.tripEndDate || null,
  };
  
  console.log('Attempting to update with data:', updateData);
  
  const { data: groupResult, error: groupError } = await supabase
    .from('groups')
    .update(updateData)
    .eq('id', groupId)
    .select()
    .single();

  console.log('Group update result:', { groupResult, groupError });
  
  if (groupError) {
    console.error('Detailed error:', groupError);
    throw new Error(`Database error: ${groupError.message}`);
  }

  // Delete existing members
  const { error: deleteError } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId);

  console.log('Delete members result:', { deleteError });

  if (deleteError) throw deleteError;

  // Insert new members
  if (groupData.members.length > 0) {
    const { error: membersError } = await supabase
      .from('group_members')
      .insert(
        groupData.members.map(memberId => ({
          group_id: groupId,
          person_id: memberId,
        }))
      );

    console.log('Insert members result:', { membersError });

    if (membersError) throw membersError;
  }

  const finalResult = await transformDbGroupToAppGroup(groupResult);
  console.log('Final transformed result:', finalResult);
  
  return finalResult;
};

// TRANSACTIONS API
export const getTransactions = async (personId?: string): Promise<Transaction[]> => {
  let query = supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });

  // If personId provided, only get transactions from groups where person is a member
  if (personId) {
    query = supabase
      .from('transactions')
      .select(`
        *,
        groups!inner(
          id,
          group_members!inner(person_id)
        )
      `)
      .eq('groups.group_members.person_id', personId)
      .order('date', { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(transformDbTransactionToAppTransaction);
};

export const addTransaction = async (
  groupId: string,
  transactionData: Omit<Transaction, 'id' | 'groupId'>
): Promise<Transaction> => {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      group_id: groupId,
      description: transactionData.description,
      amount: transactionData.amount,
      paid_by_id: transactionData.paidById,
      date: transactionData.date,
      tag: transactionData.tag,
      payment_source_id: transactionData.paymentSourceId || null,
      comment: transactionData.comment || null,
      type: transactionData.type ?? 'expense',
      split_mode: transactionData.split.mode,
      split_participants: transactionData.split.participants,
    })
    .select()
    .single();

  if (error) throw error;

  return transformDbTransactionToAppTransaction(data);
};

export const updateTransaction = async (
  transactionId: string,
  transactionData: Partial<Omit<Transaction, 'id' | 'groupId'>>
): Promise<Transaction> => {
  const updateData: any = {};

  if (transactionData.description !== undefined) updateData.description = transactionData.description;
  if (transactionData.amount !== undefined) updateData.amount = transactionData.amount;
  if (transactionData.paidById !== undefined) updateData.paid_by_id = transactionData.paidById;
  if (transactionData.date !== undefined) updateData.date = transactionData.date;
  if (transactionData.tag !== undefined) updateData.tag = transactionData.tag;
  if (transactionData.paymentSourceId !== undefined) {
    updateData.payment_source_id = transactionData.paymentSourceId || null;
  }
  if (transactionData.comment !== undefined) updateData.comment = transactionData.comment;
  if (transactionData.type !== undefined) updateData.type = transactionData.type;
  if (transactionData.split !== undefined) {
    updateData.split_mode = transactionData.split.mode;
    updateData.split_participants = transactionData.split.participants;
  }

  const { data, error } = await supabase
    .from('transactions')
    .update(updateData)
    .eq('id', transactionId)
    .select()
    .single();

  if (error) throw error;

  return transformDbTransactionToAppTransaction(data);
};

export const deleteTransaction = async (transactionId: string): Promise<{ success: boolean }> => {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId);

  if (error) throw error;

  return { success: true };
};

// PAYMENT SOURCES API
export const getPaymentSources = async (): Promise<PaymentSource[]> => {
  const { data, error } = await supabase
    .from('payment_sources')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(transformDbPaymentSourceToAppPaymentSource);
};

export const addPaymentSource = async (
  sourceData: Omit<PaymentSource, 'id'>
): Promise<PaymentSource> => {
  const { data, error } = await supabase
    .from('payment_sources')
    .insert({
      name: sourceData.name,
      type: sourceData.type,
      details: sourceData.details ? JSON.parse(JSON.stringify(sourceData.details)) : null,
    })
    .select()
    .single();

  if (error) throw error;

  return transformDbPaymentSourceToAppPaymentSource(data);
};

export const deletePaymentSource = async (paymentSourceId: string): Promise<{ success: boolean }> => {
  const { error } = await supabase
    .from('payment_sources')
    .delete()
    .eq('id', paymentSourceId);

  if (error) throw error;

  return { success: true };
};

export const archivePaymentSource = async (paymentSourceId: string): Promise<{ success: boolean }> => {
  const { error } = await supabase
    .from('payment_sources')
    .update({ is_active: false })
    .eq('id', paymentSourceId);

  if (error) throw error;

  return { success: true };
};

// PEOPLE API (bonus - you might want to manage people)
export const getPeople = async (personId?: string): Promise<Person[]> => {
  // If no personId provided, return empty array
  if (!personId) {
    return [];
  }

  // Get people who have been in groups with the current user (shared history)
  // This includes people from current and past groups the user has been part of
  const { data, error } = await supabase
    .from('people')
    .select(`
      *,
      group_members!inner(
        group_id,
        groups!inner(
          group_members!inner(person_id)
        )
      )
    `)
    .eq('group_members.groups.group_members.person_id', personId)
    .neq('id', personId); // Exclude the current user themselves

  if (error) {
    console.error('Error fetching people with shared group history:', error);
    // Fallback: return empty array if query fails
    return [];
  }

  // Remove duplicates (same person might appear multiple times if they're in multiple shared groups)
  const uniquePeople = new Map();
  (data || []).forEach(person => {
    uniquePeople.set(person.id, person);
  });

  return Array.from(uniquePeople.values()).map(transformDbPersonToAppPerson);
};

export const addPerson = async (personData: Omit<Person, 'id'>): Promise<Person> => {
  const { data, error } = await supabase
    .from('people')
    .insert({
      name: personData.name,
      avatar_url: personData.avatarUrl,
    })
    .select()
    .single();

  if (error) throw error;

  return transformDbPersonToAppPerson(data);
};

// USER MANAGEMENT
export const ensureUserExists = async (userId: string, userName: string, userEmail: string): Promise<Person> => {
  // Check if user already exists by Clerk user ID (we'll search by name for now since we don't have clerk_user_id column yet)
  const { data: existingUsers, error: fetchError } = await supabase
    .from('people')
    .select('*')
    .eq('name', userName || userEmail.split('@')[0]);

  // For now, if we find a user with the same name, return that
  if (!fetchError && existingUsers && existingUsers.length > 0) {
    return transformDbPersonToAppPerson(existingUsers[0]);
  }

  // Create new user with a proper UUID
  const { data, error } = await supabase
    .from('people')
    .insert({
      name: userName || userEmail.split('@')[0],
      avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || userEmail.split('@')[0])}&background=6366f1&color=ffffff`
    })
    .select()
    .single();

  if (error) throw error;
  return transformDbPersonToAppPerson(data);
};

// ============================================================================
// INVITE SYSTEM API FUNCTIONS - NOW ENABLED
// ============================================================================
// TypeScript types have been regenerated and include group_invites and email_invites tables

import { 
  GroupInvite, 
  EmailInvite, 
  CreateInviteRequest, 
  CreateInviteResponse, 
  ValidateInviteResponse, 
  AcceptInviteRequest, 
  AcceptInviteResponse 
} from '../types';

// Helper function to generate secure random invite token
const generateInviteToken = (): string => {
  // Generate 32-character URL-safe token
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

// Transform database invite to app invite
const transformDbInviteToAppInvite = (dbInvite: any): GroupInvite => ({
  id: dbInvite.id,
  groupId: dbInvite.group_id,
  inviteToken: dbInvite.invite_token,
  invitedBy: dbInvite.invited_by,
  expiresAt: dbInvite.expires_at,
  maxUses: dbInvite.max_uses,
  currentUses: dbInvite.current_uses,
  isActive: dbInvite.is_active,
  createdAt: dbInvite.created_at,
  updatedAt: dbInvite.updated_at,
});

// Transform database email invite to app email invite
const transformDbEmailInviteToAppEmailInvite = (dbEmailInvite: any): EmailInvite => ({
  id: dbEmailInvite.id,
  groupId: dbEmailInvite.group_id,
  groupInviteId: dbEmailInvite.group_invite_id,
  email: dbEmailInvite.email,
  invitedBy: dbEmailInvite.invited_by,
  sentAt: dbEmailInvite.sent_at,
  mailersendMessageId: dbEmailInvite.mailersend_message_id,
  mailersendStatus: dbEmailInvite.mailersend_status,
  status: dbEmailInvite.status,
  acceptedAt: dbEmailInvite.accepted_at,
  acceptedBy: dbEmailInvite.accepted_by,
  createdAt: dbEmailInvite.created_at,
});

/**
 * Create a new invite link for a group
 */
export const createGroupInvite = async (request: CreateInviteRequest & { invitedBy: string }): Promise<CreateInviteResponse> => {
  const { groupId, emails, maxUses, expiresInDays = 30, invitedBy } = request;
  
  // Check if user has permission to create invite (must be group member)
  const { data: membership } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('person_id', invitedBy)
    .single();
  
  if (!membership) {
    throw new Error('You must be a group member to create invites');
  }

  // Generate unique invite token
  const inviteToken = generateInviteToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  // Create group invite
  const { data: inviteData, error: inviteError } = await supabase
    .from('group_invites')
    .insert({
      group_id: groupId,
      invite_token: inviteToken,
      invited_by: invitedBy,
      expires_at: expiresAt.toISOString(),
      max_uses: maxUses,
      current_uses: 0,
      is_active: true,
    })
    .select()
    .single();

  if (inviteError) throw inviteError;

  const invite = transformDbInviteToAppInvite(inviteData);
  const inviteUrl = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/invite/${inviteToken}`;

  // If emails provided, create email invites (will be sent separately)
  let emailInvites: EmailInvite[] = [];
  if (emails && emails.length > 0) {
    const emailInvitePromises = emails.map(async (email) => {
      const { data: emailInviteData, error: emailError } = await supabase
        .from('email_invites')
        .insert({
          group_id: groupId,
          group_invite_id: invite.id,
          email: email.toLowerCase().trim(),
          invited_by: invitedBy,
        })
        .select()
        .single();

      if (emailError) throw emailError;
      return transformDbEmailInviteToAppEmailInvite(emailInviteData);
    });

    emailInvites = await Promise.all(emailInvitePromises);
  }

  return {
    invite,
    inviteUrl,
    emailInvites: emailInvites.length > 0 ? emailInvites : undefined,
  };
};

/**
 * Validate an invite token
 */
export const validateInvite = async (inviteToken: string): Promise<ValidateInviteResponse> => {
  // Get invite with group info
  const { data: inviteData, error } = await supabase
    .from('group_invites')
    .select(`
      *,
      groups (
        id,
        name,
        currency,
        group_type,
        trip_start_date,
        trip_end_date,
        created_by,
        is_archived
      )
    `)
    .eq('invite_token', inviteToken)
    .eq('is_active', true)
    .single();

  if (error || !inviteData) {
    return {
      isValid: false,
      error: 'Invite not found or expired',
    };
  }

  // Check if expired
  const now = new Date();
  const expiresAt = new Date(inviteData.expires_at);
  if (now > expiresAt) {
    // Deactivate expired invite
    await supabase
      .from('group_invites')
      .update({ is_active: false })
      .eq('id', inviteData.id);

    return {
      isValid: false,
      error: 'Invite has expired',
    };
  }

  // Check usage limits
  if (inviteData.max_uses !== null && inviteData.current_uses >= inviteData.max_uses) {
    return {
      isValid: false,
      error: 'Invite has reached maximum usage limit',
    };
  }

  const invite = transformDbInviteToAppInvite(inviteData);
  
  // Transform the joined group data to the expected format
  const groupData = inviteData.groups;
  const group: Group = {
    id: groupData.id,
    name: groupData.name,
    currency: groupData.currency,
    groupType: groupData.group_type as GroupType,
    tripStartDate: groupData.trip_start_date || undefined,
    tripEndDate: groupData.trip_end_date || undefined,
    createdBy: groupData.created_by || undefined,
    isArchived: groupData.is_archived || false,
    members: [] // Will be populated by transformDbGroupToAppGroup if needed
  };

  return {
    isValid: true,
    invite,
    group,
  };
};

/**
 * Accept an invite and join the group
 */
export const acceptInvite = async (request: AcceptInviteRequest): Promise<AcceptInviteResponse> => {
  const { inviteToken, personId } = request;

  // First validate the invite
  const validation = await validateInvite(inviteToken);
  if (!validation.isValid || !validation.invite || !validation.group) {
    return {
      success: false,
      error: validation.error || 'Invalid invite',
    };
  }

  // Check if user is already a member
  const { data: existingMember } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', validation.group.id)
    .eq('person_id', personId)
    .single();

  if (existingMember) {
    return {
      success: false,
      error: 'You are already a member of this group',
    };
  }

  // Add user to group
  const { error: memberError } = await supabase
    .from('group_members')
    .insert({
      group_id: validation.group.id,
      person_id: personId,
    });

  if (memberError) {
    return {
      success: false,
      error: 'Failed to join group',
    };
  }

  // Update invite usage count
  const { error: updateError } = await supabase
    .from('group_invites')
    .update({ 
      current_uses: validation.invite.currentUses + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', validation.invite.id);

  if (updateError) {
    console.error('Failed to update invite usage count:', updateError);
  }

  // Update email invite status if this person accepted via email
  await supabase
    .from('email_invites')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      accepted_by: personId,
    })
    .eq('group_invite_id', validation.invite.id)
    .eq('status', 'pending');

  return {
    success: true,
    group: validation.group,
  };
};

/**
 * Get all invites for a group (for management purposes)
 */
export const getGroupInvites = async (groupId: string): Promise<GroupInvite[]> => {
  const { data, error } = await supabase
    .from('group_invites')
    .select('*')
    .eq('group_id', groupId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(transformDbInviteToAppInvite);
};

/**
 * Deactivate an invite
 */
export const deactivateInvite = async (inviteId: string): Promise<{ success: boolean }> => {
  const { error } = await supabase
    .from('group_invites')
    .update({ 
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', inviteId);

  if (error) throw error;
  return { success: true };
};

/**
 * Clean up expired invites (utility function)
 */
export const cleanupExpiredInvites = async (): Promise<number> => {
  const { data, error } = await supabase.rpc('cleanup_expired_invites');
  if (error) throw error;
  return data || 0;
};
