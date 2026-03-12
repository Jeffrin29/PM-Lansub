"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function AuthPage() {

  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  function handleLogin() {

    if (email === "admin@lansub.com" && password === "admin123") {

      localStorage.setItem("lansub-auth", "true");

      router.push("/dashboard");

    } else {

      setError("Invalid email or password");

    }

  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">

      <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl p-10 rounded-xl border border-zinc-800 shadow-2xl">

        <AnimatePresence mode="wait">

          {isLogin ? (

            <motion.div
              key="login"
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -80 }}
              transition={{ duration: 0.35 }}
            >

              <h1 className="text-3xl font-semibold text-white text-center">
                LANSUB
              </h1>

              <p className="text-gray-400 text-center text-sm mt-1 mb-8">
                Login to your account
              </p>


              {error && (
                <p className="text-red-500 text-sm mb-4 text-center">
                  {error}
                </p>
              )}


              <div className="mb-4">
                <label className="text-sm text-gray-400">
                  Email
                </label>

                <input
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full mt-1 p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>


              <div className="mb-6">
                <label className="text-sm text-gray-400">
                  Password
                </label>

                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full mt-1 p-3 bg-black border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>


              <button
                onClick={handleLogin}
                className="w-full py-3 bg-zinc-200 text-black rounded-lg font-medium hover:bg-white transition"
              >
                Login
              </button>


              <p className="text-center text-gray-400 text-sm mt-6">
                Don't have an account?{" "}
                <span
                  onClick={() => setIsLogin(false)}
                  className="text-blue-400 cursor-pointer hover:underline"
                >
                  Sign in
                </span>
              </p>

            </motion.div>

          ) : (

            <motion.div
              key="signup"
              initial={{ opacity: 0, x: -80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 80 }}
              transition={{ duration: 0.35 }}
            >

              <h1 className="text-3xl font-semibold text-white text-center mb-8">
                Create an account
              </h1>

              <div className="mb-4">
                <label className="text-sm text-gray-400">
                  Name
                </label>

                <input
                  type="text"
                  placeholder="Enter name"
                  className="w-full mt-1 p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="text-sm text-gray-400">
                  Email
                </label>

                <input
                  type="email"
                  placeholder="Enter email"
                  className="w-full mt-1 p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="mb-6">
                <label className="text-sm text-gray-400">
                  Password
                </label>

                <input
                  type="password"
                  placeholder="Create password"
                  className="w-full mt-1 p-3 bg-black border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button className="w-full py-3 bg-zinc-200 text-black rounded-lg font-medium hover:bg-white transition">
                Create account
              </button>

              <p className="text-center text-gray-400 text-sm mt-6">
                Already have an account?{" "}
                <span
                  onClick={() => setIsLogin(true)}
                  className="text-blue-400 cursor-pointer hover:underline"
                >
                  Login
                </span>
              </p>

            </motion.div>

          )}

        </AnimatePresence>

      </div>

    </div>
  );
}