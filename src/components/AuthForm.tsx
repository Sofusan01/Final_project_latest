"use client";
import { useState } from "react";
import Link from "next/link";

type Props = {
  type: "login" | "register";
  onSubmit: (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => Promise<void>;
  loading?: boolean;
  hideHeader?: boolean;
  hideLinks?: boolean;
};

export default function AuthForm({ type, onSubmit, loading, hideHeader = false, hideLinks = false }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    // Email validation
    if (!email.trim()) {
      errors.email = "กรุณากรอกอีเมล";
    } else if (!validateEmail(email)) {
      errors.email = "รูปแบบอีเมลไม่ถูกต้อง";
    }

    // Password validation
    if (!password.trim()) {
      errors.password = "กรุณากรอกรหัสผ่าน";
    } else if (!validatePassword(password)) {
      errors.password = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
    }

    // Registration specific validations
    if (type === "register") {
      // Name validation
      if (!firstName.trim()) {
        errors.firstName = "กรุณากรอกชื่อ";
      }
      if (!lastName.trim()) {
        errors.lastName = "กรุณากรอกนามสกุล";
      }

      // Password confirmation validation
      if (!confirmPassword.trim()) {
        errors.confirmPassword = "กรุณายืนยันรหัสผ่าน";
      } else if (password !== confirmPassword) {
        errors.confirmPassword = "รหัสผ่านไม่ตรงกัน";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    await onSubmit(email, password, firstName, lastName);
  };

  return (
    <div className="flex flex-col items-center">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 w-full max-w-md card p-8 animate-scale-in"
      >
        {!hideHeader && (
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-heading mb-3">
              {type === "login" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-body text-base font-medium">
              {type === "login" ? "Sign in to your account" : "Join our plant monitoring system"}
            </p>
          </div>
        )}
        
        {type === "register" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                className={`input ${validationErrors.firstName ? 'border-red-500' : ''}`}
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              {validationErrors.firstName && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.firstName}</p>
              )}
            </div>
            <div>
              <input
                type="text"
                className={`input ${validationErrors.lastName ? 'border-red-500' : ''}`}
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
              {validationErrors.lastName && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.lastName}</p>
              )}
            </div>
          </div>
        )}
        
        <div>
          <input
            type="email"
            autoComplete="username"
            className={`input ${validationErrors.email ? 'border-red-500' : ''}`}
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
          {validationErrors.email && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
          )}
        </div>
        
        <div>
          <input
            type="password"
            autoComplete={type === "login" ? "current-password" : "new-password"}
            className={`input ${validationErrors.password ? 'border-red-500' : ''}`}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
            minLength={6}
          />
          {validationErrors.password && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.password}</p>
          )}
        </div>

        {type === "register" && (
          <div>
            <input
              type="password"
              autoComplete="new-password"
              className={`input ${validationErrors.confirmPassword ? 'border-red-500' : ''}`}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
            />
            {validationErrors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.confirmPassword}</p>
            )}
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading
            ? "Processing..."
            : type === "login"
              ? "Sign In"
              : "Create Account"}
        </button>
      </form>
      
      {/* Link section */}
      {!hideLinks && (
        <>
          {type === "login" ? (
            <div className="text-center mt-8 text-muted">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-neutral-900 hover:text-neutral-700 underline font-semibold transition-colors duration-200"
              >
                Sign up
              </Link>
            </div>
          ) : (
            <div className="text-center mt-8 text-muted">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-neutral-900 hover:text-neutral-700 underline font-semibold transition-colors duration-200"
              >
                Sign in
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
