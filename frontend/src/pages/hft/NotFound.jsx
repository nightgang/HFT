import React from "react";
import { AlertTriangle } from "lucide-react";

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-8">
      <div className="max-w-md text-center rounded-3xl border border-purple-500/20 bg-slate-900/90 p-10 shadow-2xl shadow-purple-500/10">
        <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-purple-400" />
        <h1 className="text-3xl font-bold mb-2">Page Not Found</h1>
        <p className="text-slate-400 mb-6">
          The route you are looking for does not exist. Use the sidebar to navigate back to the dashboard.
        </p>
      </div>
    </div>
  );
}

export default NotFound;
