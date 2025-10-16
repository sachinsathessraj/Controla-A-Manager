import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gecyohwgayxqdrmzqsfz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlY3lvaHdnYXl4cWRybXpxc2Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0Mzg2ODksImV4cCI6MjA2OTAxNDY4OX0.aPWJDprRC7SWGEj_CA2Oj0CGTcHLY2WMRkgBU6l33SA';

export const supabase = createClient(supabaseUrl, supabaseKey); 