import { createLovableAuth } from "@lovable.dev/cloud-auth-js";
import { supabase } from "@/integrations/supabase/client";

const auth = createLovableAuth({
  oauthBrokerUrl: "https://oauth.lovable.app/initiate",
});

const oauthParams = {
  project_id: "823a6997-aab0-4107-82b7-459091e3a79f",
  project_env: "prod",
};

async function signInWithBroker(provider: "google" | "apple") {
  const result = await auth.signInWithOAuth(provider, {
    // Let Lovable choose its registered callback. A custom /auth redirect URI
    // was rejected by the OAuth provider as an unapproved redirect_uri.
    extraParams: oauthParams,
  });

  if (result.redirected || result.error) return result;

  try {
    const { error } = await supabase.auth.setSession(result.tokens);
    if (error) return { error };
  } catch (error) {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  // Use one post-auth entry point for both providers. The /app route checks
  // the authenticated user's shop through RLS and sends first-time users
  // without a shop to /onboarding; existing shop owners reach their workspace.
  window.location.assign("/app");
  return result;
}

export function signInWithGoogle() {
  return signInWithBroker("google");
}

export function signInWithApple() {
  return signInWithBroker("apple");
}
