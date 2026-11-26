import { createLovableAuth } from "@lovable.dev/cloud-auth-js";
import { supabase } from "@/integrations/supabase/client";

const auth = createLovableAuth({
  oauthBrokerUrl: "https://oauth.lovable.app/initiate",
});

export async function signInWithGoogle(redirectUri: string) {
  const result = await auth.signInWithOAuth("google", {
    redirect_uri: redirectUri,
    extraParams: {
      project_id: "823a6997-aab0-4107-82b7-459091e3a79f",
      project_env: "prod",
    },
  });

  if (result.redirected || result.error) {
    return result;
  }

  try {
    await supabase.auth.setSession(result.tokens);
  } catch (error) {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  return result;
}
