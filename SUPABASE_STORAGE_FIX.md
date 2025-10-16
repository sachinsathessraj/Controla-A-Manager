# Supabase Storage Fix for A+ Content Manager

## Problem
You're getting a 403 Unauthorized error with the message "new row violates row-level security policy" when trying to upload images to Supabase storage.

## Solution

### Option 1: Run SQL Script (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase-storage-policies.sql` into the editor
4. Run the script

This will create the necessary Row Level Security (RLS) policies to allow image uploads.

### Option 2: Manual Policy Creation

If the script doesn't work, manually create these policies in your Supabase dashboard:

1. Go to Storage > Policies
2. Select the `aplus-images` bucket
3. Add these policies:

**Policy 1: Allow Uploads**
- Policy Name: "Allow anonymous uploads"
- Operation: INSERT
- Target Roles: anon, authenticated
- Policy Definition: `bucket_id = 'aplus-images'`

**Policy 2: Allow Reads**
- Policy Name: "Allow anonymous reads"
- Operation: SELECT
- Target Roles: anon, authenticated
- Policy Definition: `bucket_id = 'aplus-images'`

### Option 3: Disable RLS (Less Secure)

If you want to completely disable RLS for the storage bucket:

1. Go to Storage > Policies
2. Find the `aplus-images` bucket
3. Toggle off "Row Level Security"

⚠️ **Warning**: This makes your storage bucket completely public.

## Automatic Fallback

The application now includes an automatic fallback mechanism:

- If Supabase storage fails, images will be stored locally using IndexedDB/localStorage
- This ensures the app continues to work even if there are storage issues
- Local images are automatically handled by the updated code

## Testing

After applying the fix:

1. Try uploading an image in the application
2. Check the browser console for any remaining errors
3. Verify that images are being stored and displayed correctly

## Troubleshooting

If you still have issues:

1. Check that the `aplus-images` bucket exists in your Supabase project
2. Verify that the bucket is set to public
3. Ensure your Supabase API keys are correct
4. Check the browser console for detailed error messages

## Support

If you continue to experience issues, please check:
- Supabase project settings
- Network connectivity
- Browser console for additional error details 