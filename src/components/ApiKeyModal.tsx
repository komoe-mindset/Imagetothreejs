import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Check, X, Shield, ExternalLink, Trash2 } from 'lucide-react';
import { getStoredApiKey, saveApiKey } from '../services/gemini';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onKeySaved }) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getStoredApiKey());
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveApiKey(apiKey);
    setSavedSuccess(true);
    onKeySaved(apiKey);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleClear = () => {
    saveApiKey('');
    setApiKey('');
    onKeySaved('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-key-modal-title"
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-750 rounded-2xl shadow-2xl overflow-hidden p-6 text-neutral-100">
        {/* Close Button */}
        <button
          type="button"
          role="button"
          onClick={onClose}
          aria-label="Close API Key Configuration Dialog"
          title="Close Dialog"
          className="absolute top-4 right-4 p-2 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300"
            aria-hidden="true"
          >
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 id="api-key-modal-title" className="text-base font-bold text-white">
              Google Gemini API Key
            </h2>
            <p className="text-xs text-neutral-300">
              Configure your key for 2D to 3D AI conversion
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div
          role="note"
          className="mb-4 p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-start gap-2.5"
        >
          <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-xs text-neutral-250 leading-relaxed">
            Your API key is stored securely in your browser's <code className="text-indigo-300 font-mono">localStorage</code>. It is never logged or stored on any third-party database.
          </p>
        </div>

        {/* Input Field */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-200">
            <label htmlFor="gemini-api-key-input">Gemini API Key</label>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              aria-label="Get a free Gemini API key from Google AI Studio (opens in new tab)"
              className="text-xs text-indigo-300 hover:text-indigo-200 flex items-center gap-1 transition-colors underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              Get free key <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
          </div>
          <div className="relative">
            <input
              id="gemini-api-key-input"
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              aria-describedby="api-key-help"
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 focus:border-indigo-400 rounded-xl text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 pr-10 font-mono transition-all"
            />
            <button
              type="button"
              role="button"
              onClick={() => setShowKey(!showKey)}
              aria-label={showKey ? 'Hide Gemini API key' : 'Show Gemini API key in plain text'}
              title={showKey ? 'Hide API key' : 'Show API key'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-white p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded"
            >
              {showKey ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
            </button>
          </div>
          <span id="api-key-help" className="sr-only">
            Enter your Google Gemini API key to authenticate requests.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2">
          {apiKey ? (
            <button
              type="button"
              role="button"
              onClick={handleClear}
              aria-label="Remove stored API key from local storage"
              title="Remove stored API Key"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              <span>Remove Key</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              role="button"
              onClick={onClose}
              aria-label="Cancel and close dialog"
              className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              Cancel
            </button>
            <button
              type="button"
              role="button"
              onClick={handleSave}
              aria-label="Save API key to browser storage"
              className={`flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-xl text-white shadow-lg transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                savedSuccess
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" aria-hidden="true" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Key</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
