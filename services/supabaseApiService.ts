import { supabase } from '../lib/supabase';
import { Group, Transaction, PaymentSource, Person, GroupType } from '../types';
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
  };
};

// Helper function to transform database transaction to app transaction
const transformDbTransactionToAppTransaction = (dbTransaction: DbTransaction): Transaction => {
  return {
    id: dbTransaction.id,
    groupId: dbTransaction.group_id,
    description: dbTransaction.description,
    amount: Number(dbTransaction.amount),
    paidById: dbTransaction.paid_by_id,
    date: dbTransaction.date,
    tag: dbTransaction.tag as any, // Cast to Tag type
    paymentSourceId: dbTransaction.payment_source_id || undefined,
    comment: dbTransaction.comment || undefined,
    split: {
      mode: dbTransaction.split_mode as any, // Cast to SplitMode
      participants: dbTransaction.split_participants as any, // Cast to SplitParticipant[]
    },
  };
};

// Helper function to transform database payment source to app payment source
const transformDbPaymentSourceToAppPaymentSource = (dbPaymentSource: DbPaymentSource): PaymentSource => {
  return {
    id: dbPaymentSource.id,
    name: dbPaymentSource.name,
    type: dbPaymentSource.type as any, // Cast to PaymentSourceType
    details: dbPaymentSource.details as any, // Cast to CreditCardDetails | UPIDetails
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
export const getGroups = async (): Promise<Group[]> => {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Transform each group and get its members
  const groups = await Promise.all(
    (data || []).map(dbGroup => transformDbGroupToAppGroup(dbGroup))
  );

  return groups;
};

export const addGroup = async (groupData: Omit<Group, 'id'>): Promise<Group> => {
  // Insert the group
  const { data: groupResult, error: groupError } = await supabase
    .from('groups')
    .insert({
      name: groupData.name,
      currency: groupData.currency,
      group_type: groupData.groupType,
      trip_start_date: groupData.tripStartDate || null,
      trip_end_date: groupData.tripEndDate || null,
    })
    .select()
    .single();

  if (groupError) throw groupError;

  // Insert group members
  if (groupData.members.length > 0) {
    const { error: membersError } = await supabase
      .from('group_members')
      .insert(
        groupData.members.map(memberId => ({
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
export const getTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });

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
  if (transactionData.paymentSourceId !== undefined) updateData.payment_source_id = transactionData.paymentSourceId;
  if (transactionData.comment !== undefined) updateData.comment = transactionData.comment;
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

// PEOPLE API (bonus - you might want to manage people)
export const getPeople = async (): Promise<Person[]> => {
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .order('name');

  if (error) throw error;

  return (data || []).map(transformDbPersonToAppPerson);
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
