// Debug Supabase Data Operations
// Open browser console and paste this to test what's happening

const debugSupabase = async () => {
  console.log('🔍 Debugging Supabase Data Operations...');
  
  try {
    // Import the API service
    const apiService = await import('./services/apiService.js');
    console.log('✅ API Service imported');
    
    // Test 1: Check what data currently exists
    console.log('\n📊 Current Data State:');
    
    const groups = await apiService.getGroups();
    console.log('Groups:', groups);
    
    const transactions = await apiService.getTransactions();
    console.log('Transactions:', transactions);
    
    const paymentSources = await apiService.getPaymentSources();
    console.log('Payment Sources:', paymentSources);
    
    // Test 2: Try to add a test group
    console.log('\n✏️ Testing Group Creation...');
    
    const testGroupData = {
      name: 'Debug Test Group',
      currency: 'USD',
      members: ['00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002']
    };
    
    try {
      const newGroup = await apiService.addGroup(testGroupData);
      console.log('✅ Group created successfully:', newGroup);
      
      // Test 3: Try to add a transaction to this group
      console.log('\n💰 Testing Transaction Creation...');
      
      const testTransactionData = {
        description: 'Debug Test Transaction',
        amount: 100,
        paidById: '00000000-0000-0000-0000-000000000001',
        date: '2025-10-03',
        tag: 'Other',
        split: {
          mode: 'equal',
          participants: [
            { personId: '00000000-0000-0000-0000-000000000001', value: 1 },
            { personId: '00000000-0000-0000-0000-000000000002', value: 1 }
          ]
        }
      };
      
      const newTransaction = await apiService.addTransaction(newGroup.id, testTransactionData);
      console.log('✅ Transaction created successfully:', newTransaction);
      
      // Test 4: Verify data persists by refetching
      console.log('\n🔄 Testing Data Persistence...');
      
      const updatedGroups = await apiService.getGroups();
      const updatedTransactions = await apiService.getTransactions();
      
      console.log('Updated Groups:', updatedGroups);
      console.log('Updated Transactions:', updatedTransactions);
      
      // Clean up test data
      console.log('\n🧹 Cleaning up test data...');
      
      const { supabase } = await import('./lib/supabase.js');
      
      // Delete test transaction
      await supabase.from('transactions').delete().eq('id', newTransaction.id);
      console.log('✅ Test transaction deleted');
      
      // Delete test group
      await supabase.from('groups').delete().eq('id', newGroup.id);
      console.log('✅ Test group deleted');
      
    } catch (groupError) {
      console.error('❌ Group creation failed:', groupError);
    }
    
    // Test 5: Check if the issue is with existing data
    console.log('\n🔍 Testing Direct Supabase Queries...');
    
    const { supabase } = await import('./lib/supabase.js');
    
    const { data: peopleData, error: peopleError } = await supabase
      .from('people')
      .select('*');
    
    if (peopleError) {
      console.error('❌ People query failed:', peopleError);
    } else {
      console.log('✅ People in database:', peopleData);
    }
    
    const { data: groupsData, error: groupsError } = await supabase
      .from('groups')
      .select(`
        *,
        group_members (
          person_id
        )
      `);
    
    if (groupsError) {
      console.error('❌ Groups query failed:', groupsError);
    } else {
      console.log('✅ Groups with members:', groupsData);
    }
    
    console.log('\n🎉 Debug completed! Check results above.');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
};

// Run the debug
debugSupabase();