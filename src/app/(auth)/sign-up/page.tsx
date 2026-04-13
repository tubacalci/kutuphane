"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ensureUserProfile } from "@/lib/auth";
import { getSupabaseClient } from "@/lib/supabase";

export default function SignUpPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Email and password are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: displayName.trim() || null,
          },
        },
      });
      if (error) throw error;

      if (data.user && data.session) {
        await ensureUserProfile(data.user);
        router.push("/search");
        router.refresh();
        return;
      }

      setMessage(
        "Account created. Please verify your email, then sign in to continue."
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not create account."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
        <p className="text-sm text-muted-foreground">
          Sign up to save books into your personal library.
        </p>
      </div>

      <form className="space-y-3" onSubmit={onSubmit}>
        <Input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Display name (optional)"
          autoComplete="name"
        />
        <Input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          placeholder="Email"
          autoComplete="email"
          required
        />
        <Input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          placeholder="Password"
          autoComplete="new-password"
          required
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign up
        </Button>
      </form>

      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <p className="text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-foreground underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
