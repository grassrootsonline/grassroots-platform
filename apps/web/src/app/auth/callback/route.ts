import { createServerClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');

  const supabase = await createServerClient();

  // PKCE flow (OAuth, magic link)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/waitlisted`);
    }
  }

  // Email OTP flow (email confirmation link)
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as 'email' });
    if (!error) {
      return NextResponse.redirect(`${origin}/waitlisted`);
    }
  }

  // Error: expired link, already used, etc.
  return NextResponse.redirect(`${origin}/login?error=verification_expired`);
}
