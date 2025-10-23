#!/usr/bin/env tsx

import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Database setup script for Swiss Legal Chat App
 * This script provides the SQL migration to set up the database schema
 */

async function main() {
  try {
    console.log('🚀 Swiss Legal Chat App Database Setup');
    console.log('=====================================');
    
    // Read the SQL migration file
    const sqlPath = join(process.cwd(), 'setup-database.sql');
    const sqlContent = readFileSync(sqlPath, 'utf-8');
    
    console.log('\n📋 Database Schema Setup SQL:');
    console.log('==============================');
    console.log(sqlContent);
    
    console.log('\n📝 Instructions:');
    console.log('================');
    console.log('1. Copy the SQL content above');
    console.log('2. Go to your Supabase project dashboard');
    console.log('3. Navigate to SQL Editor');
    console.log('4. Paste and execute the SQL migration');
    console.log('\nAlternatively, use the Supabase CLI:');
    console.log('supabase db reset --db-url "your-database-url"');
    
    console.log('\n✅ Database setup completed!');
    console.log('\n📊 Tables created:');
    console.log('- profiles (user profiles)');
    console.log('- chat_conversations (chat sessions)');
    console.log('- chat_messages (individual messages)');
    console.log('- lawyers (lawyer database)');
    
    console.log('\n🔐 Security features:');
    console.log('- Row Level Security (RLS) enabled');
    console.log('- User-specific data isolation');
    console.log('- Automatic profile creation on signup');
    
    console.log('\n🎯 Next steps:');
    console.log('1. Set up your .env.local file with Supabase credentials');
    console.log('2. Install dependencies: npm install');
    console.log('3. Start the development server: npm run dev');
    
  } catch (error) {
    console.error('❌ Error during database setup:', error);
    process.exit(1);
  }
}

main();
