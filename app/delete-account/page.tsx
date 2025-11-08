"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Metadata } from "next";
import Link from "next/link";


type FormState = {
  phone: string;
  email: string;
  reason: string;
};

export default function DeleteAccountPage() {
  const [formState, setFormState] = useState<FormState>({
    phone: "",
    email: "",
    reason: "",
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (delayRef.current) {
        clearTimeout(delayRef.current);
      }
    };
  }, []);

  const handleChange = (
    field: keyof FormState,
    value: FormState[keyof FormState],
  ) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
    setStatus("idle");
  };

  const mockValidate = ({ phone, email }: FormState) => {
    const newErrors: string[] = [];

    if (!phone.trim()) {
      newErrors.push("Phone number is required.");
    } else if (!/^[+0-9\s()-]{7,}$/.test(phone.trim())) {
      newErrors.push("Enter a valid phone number.");
    }

    if (!email.trim()) {
      newErrors.push("Email address is required.");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.push("Enter a valid email address.");
    }

    return newErrors;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = mockValidate(formState);

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setStatus("idle");
      return;
    }

    setErrors([]);
    setStatus("loading");

    // Mock request/validation delay
    delayRef.current = setTimeout(() => {
      delayRef.current = null;
      setStatus("success");
      setFormState({
        phone: "",
        email: "",
        reason: "",
      });
    }, 5000);
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-12 text-gray-900">
      <header className="flex flex-col gap-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-rose-600">
          Account Deletion
        </p>
        <h1 className="text-3xl font-bold sm:text-4xl">
          Request Account Removal
        </h1>
        <p className="text-base text-gray-600">
          Submit your details below to request deletion of your account and
          associated personal data. We will verify the request and confirm via
          email within one business day.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-lg border border-gray-200 bg-white p-6"
        noValidate
      >
        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={formState.phone}
            onChange={(event) => handleChange("phone", event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
            placeholder="+41 79 123 45 67"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={formState.email}
            onChange={(event) => handleChange("email", event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="reason" className="text-sm font-medium text-gray-700">
            Reason for Deletion <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            id="reason"
            name="reason"
            rows={4}
            value={formState.reason}
            onChange={(event) => handleChange("reason", event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
            placeholder="Let us know why you would like to delete your account."
          />
        </div>

        {errors.length > 0 && (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <p className="font-medium">Please fix the following:</p>
            <ul className="list-disc space-y-1 pl-6">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {status === "success" && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            Your deletion request has been received. We&apos;ll confirm via email
            shortly.
          </div>
        )}

        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-base font-semibold text-white transition hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-75"
          disabled={status === "loading"}
        >
          {status === "loading" && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
          )}
          {status === "loading" ? "Processing request..." : "Proceed"}
        </button>
      </form>

      
    </div>
  );
}

