// /src/components/Modal.tsx
"use client";
import React from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  message: string;
};

export default function Modal({ open, onClose, title, message }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed z-50 inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="card p-8 min-w-[320px] max-w-sm text-neutral-900 animate-scale-in">
        {title && (
          <h3 className="font-bold text-xl mb-3 text-heading">{title}</h3>
        )}
        <p className="text-body text-base leading-relaxed">{message}</p>
        <button
          className="mt-6 w-full btn-primary"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
