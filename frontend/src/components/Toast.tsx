"use client";

import React, { useEffect, useState } from 'react';
import { Toast as ToastType } from '@/contexts/ToastContext';
import { useToast } from '@/contexts/ToastContext';

interface ToastProps {
  toast: ToastType;
}

const Toast: React.FC<ToastProps> = ({ toast }) => {
  const { removeToast } = useToast();
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Animate in when component mounts
    const enterTimer = setTimeout(() => setIsVisible(true), 10);
    
    return () => clearTimeout(enterTimer);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    // Wait for exit animation to complete before removing
    setTimeout(() => removeToast(toast.id), 400);
  };

  // Auto-remove toast when duration ends
  useEffect(() => {
    if (toast.duration !== 0) {
      const timer = setTimeout(handleClose, toast.duration || 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, toast.id, removeToast]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return (
          <div className="inline-flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"/>
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="inline-flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z"/>
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="inline-flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM10 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-4a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v5Z"/>
            </svg>
          </div>
        );
      case 'info':
        return (
          <div className="inline-flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"/>
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-white dark:bg-gray-800 border-l-4 border-green-500 shadow-xl';
      case 'error':
        return 'bg-white dark:bg-gray-800 border-l-4 border-red-500 shadow-xl';
      case 'warning':
        return 'bg-white dark:bg-gray-800 border-l-4 border-amber-500 shadow-xl';
      case 'info':
        return 'bg-white dark:bg-gray-800 border-l-4 border-blue-500 shadow-xl';
      default:
        return 'bg-white dark:bg-gray-800 border-l-4 border-gray-500 shadow-xl';
    }
  };

  const getTextColor = () => {
    switch (toast.type) {
      case 'success':
        return 'text-gray-800 dark:text-gray-100';
      case 'error':
        return 'text-gray-800 dark:text-gray-100';
      case 'warning':
        return 'text-gray-800 dark:text-gray-100';
      case 'info':
        return 'text-gray-800 dark:text-gray-100';
      default:
        return 'text-gray-800 dark:text-gray-100';
    }
  };

  return (
    <div
        className={`
        flex items-start w-96 p-5 mb-4 rounded-lg transition-all duration-400 ease-out
        ${getBackgroundColor()}
        ${getTextColor()}
        font-sans
        transform-gpu
        `}
        role="alert"
        style={{
        transform: isExiting ? 'translateX(100%)' : isVisible ? 'translateX(0)' : 'translateX(100%)',
        opacity: isExiting ? 0 : isVisible ? 1 : 0,
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease-out',
        }}
    >
        <div className="flex-shrink-0 mr-4">
        {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold leading-6 mb-2 tracking-wide">{toast.title}</h3>
        <p className="text-sm font-normal opacity-90 leading-5">{toast.message}</p>
        </div>
        
        <button
        type="button"
        className="flex-shrink-0 ml-4 -mt-1 -mr-1 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
        onClick={handleClose}
        aria-label="Close"
        >
        <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
        </svg>
        </button>
    </div>
    );
};

export default Toast;