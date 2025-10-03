"use client";

import Modal from "./Modal";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false
}: ConfirmationModalProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          confirmButton: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
          icon: "🔴",
          iconColor: "text-red-600"
        };
      case "warning":
        return {
          confirmButton: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500",
          icon: "⚠️",
          iconColor: "text-yellow-600"
        };
      case "info":
        return {
          confirmButton: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
          icon: "ℹ️",
          iconColor: "text-blue-600"
        };
      default:
        return {
          confirmButton: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
          icon: "🔴",
          iconColor: "text-red-600"
        };
    }
  };

  const styles = getVariantStyles();

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="p-6 space-y-4">
        {/* Icon and Message */}
        <div className="flex items-start space-x-4">
          <div className={`text-2xl ${styles.iconColor} flex-shrink-0`}>
            {styles.icon}
          </div>
          <div className="flex-1">
            <p className="text-gray-700 whitespace-pre-wrap">{message}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-offset-2 ${styles.confirmButton}`}
          >
            {isLoading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}