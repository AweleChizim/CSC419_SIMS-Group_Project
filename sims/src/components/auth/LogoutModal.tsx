/**
 * LogoutModal Component
 *
 * Confirmation modal for logout action.
 */

"use client";

import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function LogoutModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: LogoutModalProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={!isLoading}>
      <div className="p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Confirm Logout
        </h2>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Are you sure you want to log out? You will need to log in again to access your account.
        </p>

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Logging out..." : "Log Out"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

