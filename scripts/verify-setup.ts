#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Verification script for Swiss Legal Chat App setup
 * This script verifies that the database is properly configured
 */

async function verifySetup() {
  console.log('🔍 Verifying Swiss Legal Chat App Setup');
  console.log('=====================================');

  try {
    // Check environment variables
    console.log('\n📋 Checking Environment Variables...');
    
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.log('❌ Missing environment variables:', missingVars.join(', '));
      console.log('Please create a .env.local file with the required variables.');
      return false;
    }

    console.log('✅ All required environment variables are set');

    // Test Supabase connection
    console.log('\n🔗 Testing Supabase Connection...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test basic connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.log('❌ Supabase connection failed:', error.message);
      return false;
    }

    console.log('✅ Supabase connection successful');

    // Check if tables exist
    console.log('\n📊 Checking Database Tables...');
    
    const tables = ['profiles', 'chat_conversations', 'chat_messages', 'lawyers'];
    
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`❌ Table '${table}' not found or not accessible`);
          return false;
        }
        console.log(`✅ Table '${table}' exists and is accessible`);
      } catch (err) {
        console.log(`❌ Error checking table '${table}':`, err);
        return false;
      }
    }

    // Check if lawyers data exists
    console.log('\n👨‍💼 Checking Lawyers Data...');
    
    const { data: lawyers, error: lawyersError } = await supabase
      .from('lawyers')
      .select('id, name, specialties')
      .limit(5);

    if (lawyersError) {
      console.log('❌ Error fetching lawyers data:', lawyersError.message);
      return false;
    }

    if (!lawyers || lawyers.length === 0) {
      console.log('⚠️  No lawyers data found. You may need to run the database setup.');
    } else {
      console.log(`✅ Found ${lawyers.length} lawyers in database`);
      console.log('Sample lawyers:', lawyers.map(l => l.name).join(', '));
    }

    // Check RLS policies (basic check)
    console.log('\n🔐 Checking Row Level Security...');
    
    // Try to access profiles table (should work for public read)
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (profilesError) {
      console.log('❌ RLS policies may not be properly configured:', profilesError.message);
      return false;
    }

    console.log('✅ RLS policies appear to be configured correctly');

    // Check if setup files exist
    console.log('\n📁 Checking Setup Files...');
    
    const setupFiles = [
      'setup-database.sql',
      'scripts/setup-database.ts',
      'SETUP_COMPLETE.md'
    ];

    for (const file of setupFiles) {
      try {
        const filePath = join(process.cwd(), file);
        readFileSync(filePath, 'utf-8');
        console.log(`✅ Setup file '${file}' exists`);
      } catch (err) {
        console.log(`❌ Setup file '${file}' not found`);
        return false;
      }
    }

    console.log('\n🎉 Setup Verification Complete!');
    console.log('================================');
    console.log('✅ All checks passed successfully!');
    console.log('\n🚀 Your Swiss Legal Chat App is ready to use!');
    console.log('\nNext steps:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Open http://localhost:3000 in your browser');
    console.log('3. Create an account and start chatting!');

    return true;

  } catch (error) {
    console.error('❌ Verification failed:', error);
    return false;
  }
}

// Run verification
verifySetup().then(success => {
  process.exit(success ? 0 : 1);
});
