// src/pages/Login.tsx - Beautiful and Responsive Login Page
import React from 'react';
import { FaSignInAlt, FaUser, FaShieldAlt } from 'react-icons/fa';

const Login = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
    <div className="max-w-md w-full space-y-8">
      {/* Header Section */}
      <div className="text-center">
        <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
          <FaShieldAlt className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to Checklist Manager
        </h2>
        <p className="text-gray-600 text-sm">
          Please sign in with your Okta account to continue
        </p>
      </div>

      {/* Login Card */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="space-y-6">
          {/* Features List */}
          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              Secure authentication with Okta
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              Access your personalized checklists
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
              Collaborate with your team
            </div>
          </div>

          {/* Login Button */}
          <button
            type="button"
            onClick={() => {
              window.location.href = `${process.env.REACT_APP_API_BASE_URL ?? ''}/login`
            }}
            className="group relative w-full flex justify-center py-4 px-6 text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-6">
              <FaSignInAlt className="h-5 w-5 text-blue-200 group-hover:text-white transition-colors duration-200" />
            </span>
            <span className="flex items-center">
              Sign in with Okta
              <svg 
                className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" 
                  clipRule="evenodd" 
                />
              </svg>
            </span>
          </button>

          {/* Alternative Authentication Note */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Single Sign-On (SSO) powered by Okta
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-500">
        <p>© 2025 Ultra Clean Technology Holding Inc.</p>
        <p className="mt-1">Secure • Reliable • Efficient</p>
      </div>
    </div>

    {/* Background Pattern */}
    <div className="absolute inset-0 -z-10 opacity-5">
      <div className="absolute inset-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}></div>
    </div>
  </div>
);

export default Login;