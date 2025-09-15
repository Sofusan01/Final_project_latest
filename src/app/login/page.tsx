"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AuthForm from "@/components/AuthForm";

const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err && 'message' in err) {
    const m = (err as { message?: unknown }).message;
    return typeof m === 'string' ? m : '';
  }
  return '';
};

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace("/dashboard");
      }
    };
    checkUser();
  }, [router]);

  const handleLogin = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        router.replace("/dashboard");
      }
    } catch (err: unknown) {
      // Map Supabase errors to user-friendly messages without logging to console
      let errorMessage = "ไม่พบผู้ใช้ในระบบ หรือ รหัสผ่านไม่ถูกต้อง";
      
      const message = getErrorMessage(err);
      if (message) {
        if (message.includes("Invalid login credentials")) {
          errorMessage = "ไม่พบผู้ใช้ในระบบ หรือ รหัสผ่านไม่ถูกต้อง";
        } else if (message.includes("Email not confirmed")) {
          errorMessage = "กรุณายืนยันอีเมลของคุณก่อนเข้าสู่ระบบ";
        } else if (message.includes("Too many requests")) {
          errorMessage = "มีการพยายามเข้าสู่ระบบมากเกินไป กรุณาลองใหม่ภายหลัง";
        } else {
          errorMessage = "ไม่พบผู้ใช้ในระบบ หรือ รหัสผ่านไม่ถูกต้อง";
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Welcome Back</h1>
          <p className="text-neutral-600">Sign in to your account</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        <AuthForm
          type="login"
          onSubmit={handleLogin}
          loading={loading}
          hideHeader={true}
          hideLinks={true}
        />

        <div className="text-center mt-6">
          <p className="text-neutral-600">
            Don&apos;t have an account?{" "}
            <a href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}