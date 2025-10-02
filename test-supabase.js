// Test Supabase Database Connection and Tables
// Run this in the browser console to test database connectivity

const testSupabaseConnection = async () => {
  console.log('🧪 Testing Supabase Connection...');
  
  try {
    // Import supabase client
    const { supabase } = await import('./lib/supabase.js');
    console.log('✅ Supabase client imported successfully');
    
    // Test 1: Check if tables exist by trying to count rows
    console.log('\n📊 Testing table existence...');
    
    const tables = ['people', 'groups', 'group_members', 'transactions', 'payment_sources'];
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error(`❌ Table '${table}' error:`, error.message);
        } else {
          console.log(`✅ Table '${table}' exists with ${count} rows`);
        }
      } catch (err) {
        console.error(`❌ Table '${table}' failed:`, err);
      }
    }
    
    // Test 2: Try to fetch data
    console.log('\n📖 Testing data fetching...');
    
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('*');
    
    if (groupsError) {
      console.error('❌ Groups fetch error:', groupsError);
    } else {
      console.log('✅ Groups fetched:', groups?.length || 0, 'groups');
    }
    
    // Test 3: Try to insert test data (then delete it)
    console.log('\n✏️ Testing data insertion...');
    
    const testGroup = {
      name: 'Test Group - DELETE ME',
      currency: 'USD'
    };
    
    const { data: insertedGroup, error: insertError } = await supabase
      .from('groups')
      .insert(testGroup)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Insert test failed:', insertError);
    } else {
      console.log('✅ Test group inserted:', insertedGroup);
      
      // Clean up - delete the test group
      const { error: deleteError } = await supabase
        .from('groups')
        .delete()
        .eq('id', insertedGroup.id);
      
      if (deleteError) {
        console.error('❌ Cleanup failed:', deleteError);
      } else {
        console.log('✅ Test group cleaned up');
      }
    }
    
    console.log('\n🎉 Database test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testSupabaseConnection();