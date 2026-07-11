"use client";

import { useState, FormEvent } from "react";
import { supabase } from "@/lib/conn/supabaseClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const validateEmail = (value: string): boolean => {
    if (!value.trim()) {
      setEmailError("Email wajib diisi");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError("Masukkan alamat email yang valid");
      return false;
    }
    setEmailError(null);
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateEmail(email)) return;

    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: window.location.origin + "/reset-password",
        }
      );

      if (resetError) {
        setError(
          resetError.message === "User not found"
            ? "Email tidak ditemukan. Periksa kembali alamat email Anda."
            : resetError.message || "Gagal mengirim tautan reset kata sandi."
        );
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              Lupa Kata Sandi
            </h1>

            {success ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <svg
                      className="h-8 w-8 text-green-600 dark:text-green-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Email Terkirim!
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Tautan reset kata sandi telah dikirim ke{" "}
                    <span className="font-medium text-gray-900 dark:text-white">
                      {email}
                    </span>
                    . Silakan periksa kotak masuk email Anda.
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Tidak menerima email? Periksa folder spam atau coba lagi.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSuccess(false);
                    setEmail("");
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700
                           text-white font-semibold py-3 px-6 rounded-lg
                           transform transition-all duration-200 hover:scale-105
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                           shadow-lg hover:shadow-xl"
                >
                  Kirim Ulang Email
                </button>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <p className="text-gray-600 dark:text-gray-300">
                    Masukkan email Anda untuk menerima tautan reset kata sandi
                  </p>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      {error}
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) validateEmail(e.target.value);
                      }}
                      onBlur={() => {
                        if (email) validateEmail(email);
                      }}
                      className={`w-full px-4 py-3 border rounded-lg
                               bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm
                               text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent
                               transition-all duration-200 ${
                                 emailError
                                   ? "border-red-500 dark:border-red-400"
                                   : "border-gray-300 dark:border-gray-600"
                               }`}
                      placeholder="Masukkan email Anda"
                    />
                    {emailError && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {emailError}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700
                             text-white font-semibold py-3 px-6 rounded-lg
                             transform transition-all duration-200 hover:scale-105
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                             shadow-lg hover:shadow-xl
                             disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Mengirim...
                      </span>
                    ) : (
                      "Kirim Tautan Reset"
                    )}
                  </button>
                </form>
              </>
            )}

            <div className="mt-8 text-center">
              <p className="text-gray-600 dark:text-gray-300">
                Ingat kata sandi Anda?{" "}
                <a
                  href="/login"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                >
                  Masuk di sini
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
