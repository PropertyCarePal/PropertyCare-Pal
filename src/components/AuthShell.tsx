
import React from "react";

type AuthShellProps = {
  title: string;
  subtitle: string;
  footer: React.ReactNode;
  children: React.ReactNode;
};

export default function AuthShell({
  title,
  subtitle,
  footer,
  children,
}: AuthShellProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow">
        <h1 className="text-3xl font-bold text-gray-900">
          {title}
        </h1>

        <p className="mt-2 text-gray-600">
          {subtitle}
        </p>

        <div className="mt-6">
          {children}
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          {footer}
        </div>
      </div>
    </div>
  );
}