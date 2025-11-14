"use client";

import { useEffect, useState } from "react";
import { GoAuthAPI } from "@/lib/api/goAuth";

export default function AuthDebugPage() {
  const [debug, setDebug] = useState<any>(null);

  useEffect(() => {
    const checkAuth = () => {
      const token = GoAuthAPI.getToken();
      const userInfo = GoAuthAPI.getUserInfo();
      const isAuth = GoAuthAPI.isAuthenticated();
      
      const debugInfo = {
        timestamp: new Date().toLocaleTimeString(),
        token: token ? `${token.substring(0, 20)}...` : "NOT FOUND",
        userInfo: userInfo ? {
          email: userInfo.email,
          name: userInfo.name,
          role: userInfo.role,
          id: userInfo.id
        } : "NOT FOUND",
        isAuthenticated: isAuth,
        storageKeys: {
          selly_auth_token: localStorage.getItem("selly_auth_token") ? "EXISTS" : "MISSING",
          selly_user_info: localStorage.getItem("selly_user_info") ? "EXISTS" : "MISSING",
        },
        rawStorage: {
          token: localStorage.getItem("selly_auth_token")?.substring(0, 50) + "..." || "MISSING",
          userInfo: localStorage.getItem("selly_user_info")
        }
      };
      
      setDebug(debugInfo);
      console.log("DEBUG:", debugInfo);
    };

    checkAuth();
    
    // Check again after 1 second
    const timer = setTimeout(checkAuth, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 p-8 text-white font-mono">
      <h1 className="text-3xl mb-4">🔍 Auth Debug</h1>
      <pre className="bg-gray-800 p-4 rounded overflow-auto max-h-96">
        {JSON.stringify(debug, null, 2)}
      </pre>
    </div>
  );
}
