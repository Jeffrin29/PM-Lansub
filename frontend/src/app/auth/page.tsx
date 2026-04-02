"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { authApi, setToken } from "../../lib/api";

export default function AuthPage() {

  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [name, setName] = useState("");
  const [organizationName, setOrgName] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    try {
      if (!email || !password) return setError("Please fill in all fields");
      setError("");
      setLoading(true);

      const res = await authApi.login(email, password);
      const { accessToken, user } = res?.data ?? {};
      const role = user?.role || "employee";

      if (!accessToken) throw new Error("No token received");

      // Save token + role
      setToken(accessToken, role);

      // Role-based redirect logic:
      // admin -> /dashboard/admin
      // project_manager -> /dashboard
      // hr -> /dashboard/hr
      // employee -> /dashboard/employee
      switch (role) {
        case 'admin':           router.push("/dashboard/admin"); break;
        case 'project_manager': router.push("/dashboard"); break;
        case 'hr':              router.push("/dashboard/hr"); break;
        default:                router.push("/dashboard/employee"); break;
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    try {
      if (!name || !email || !password) return setError("Please fill in all fields");
      setError("");
      setLoading(true);

      const res = await authApi.register({ name, email, password, organizationName });
      const { accessToken, user } = res?.data ?? {};
      const role = user?.role || "admin"; // First user is always org_admin -> admin

      if (!accessToken) throw new Error("No token received");

      setToken(accessToken, role);

      // Same role-based redirect for registration:
      switch (role) {
        case 'admin':           router.push("/dashboard/admin"); break;
        case 'project_manager': router.push("/dashboard"); break;
        case 'hr':              router.push("/dashboard/hr"); break;
        default:                router.push("/dashboard/employee"); break;
      }
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
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
                disabled={loading}
                className="w-full py-3 bg-zinc-200 text-black rounded-lg font-medium hover:bg-white transition disabled:opacity-50"
              >
                {loading ? "Logging in..." : "Login"}
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
                <label className="text-sm text-gray-400">Name</label>
                <input
                  type="text"
                  placeholder="Enter name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1 p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="text-sm text-gray-400">Email</label>
                <input
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full mt-1 p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="text-sm text-gray-400">Organization Name (Optional)</label>
                <input
                  type="text"
                  placeholder="Enter your organization"
                  value={organizationName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full mt-1 p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="mb-6">
                <label className="text-sm text-gray-400">Password</label>
                <input
                  type="password"
                  placeholder="Create password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full mt-1 p-3 bg-black border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button 
                onClick={handleRegister}
                disabled={loading}
                className="w-full py-3 bg-zinc-200 text-black rounded-lg font-medium hover:bg-white transition disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create account"}
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