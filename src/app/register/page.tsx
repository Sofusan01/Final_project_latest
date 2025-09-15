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

export default function RegisterPage() {
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

  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();
      
      return !error && data !== null;
    } catch {
      return false;
    }
  };

  const handleRegister = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      setLoading(true);
      setError(null);

      // Check if email already exists
      const emailExists = await checkEmailExists(email);
      if (emailExists) {
        setError("อีเมลนี้มีอยู่ในระบบแล้ว กรุณาใช้อีเมลอื่น");
        return;
      }

      // Create user account
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName || '',
            last_name: lastName || '',
            full_name: `${firstName || ''} ${lastName || ''}`.trim(),
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Create profile record with default 'user' role
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            first_name: firstName || '',
            last_name: lastName || '',
            role: 'user' // Default role
          });

        if (profileError) {
          // Don't log to console, just show user-friendly error
          setError("เกิดข้อผิดพลาดในการสร้างโปรไฟล์ กรุณาลองใหม่");
          return;
        }

        // Show success message and redirect to login
        setError(null);
        alert("ลงทะเบียนสำเร็จ! กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันบัญชีก่อนเข้าสู่ระบบ");
        router.replace("/login");
      }
    } catch (err: unknown) {
      // Map Supabase errors to user-friendly messages without logging to console
      let errorMessage = "เกิดข้อผิดพลาดในการลงทะเบียน";
      const message = getErrorMessage(err);
      
      if (message) {
        if (message.includes("User already registered")) {
          errorMessage = "อีเมลนี้มีอยู่ในระบบแล้ว กรุณาใช้อีเมลอื่น";
        } else if (message.includes("Password should be at least")) {
          errorMessage = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
        } else if (message.includes("Invalid email")) {
          errorMessage = "กรุณากรอกอีเมลที่ถูกต้อง";
        } else if (message.includes("Signup is disabled")) {
          errorMessage = "การลงทะเบียนถูกปิดใช้งานชั่วคราว";
        } else {
          errorMessage = "เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่";
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
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Create Account</h1>
          <p className="text-neutral-600">Join our plant monitoring system</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        <AuthForm
          type="register"
          onSubmit={handleRegister}
          loading={loading}
          hideHeader={true}
          hideLinks={true}
        />

        <div className="text-center mt-6">
          <p className="text-neutral-600">
            Already have an account?{" "}
            <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
