import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, X, Loader2, Check, Copy } from 'lucide-react';
import { useSelector } from 'react-redux';
import axiosClient from '../../utils/axiosClient'; // Import axiosClient

function CreateSessionButton({ problemId }) {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [showModal, setShowModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleCreateSession = async () => {
    if (!user) {
      setError("You must be logged in to create a collaborative session.");
      return;
    }

    setLoading(true);
    setError(null);
    setShareLink('');
    setIsCopied(false);

    try {
      // Use axiosClient instead of fetch for consistency
      const response = await axiosClient.post(`/code/create-session`, {
        problemId: problemId,
      });

      const data = response.data; // Axios automatically parses JSON into response.data

      setShareLink(data.shareLink);
      setShowModal(true);
      setLoading(false);

    } catch (err) {
      console.error('Error creating session:', err);
      // Axios errors have a response object for server errors
      setError(err.response?.data?.message || err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  const copyLink = () => {
    const tempInput = document.createElement('input');
    document.body.appendChild(tempInput);
    tempInput.value = shareLink;
    tempInput.select();
    try {
        document.execCommand('copy');
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
        console.error('Failed to copy link', err);
        alert('Failed to copy link. Please copy manually: ' + shareLink);
    } finally {
        document.body.removeChild(tempInput);
    }
  };

  return (
    <div className="p-2">
      <button
        onClick={handleCreateSession}
        className="btn btn-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl px-4 py-2 flex items-center space-x-1 text-sm"
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="animate-spin" size={16} />
        ) : (
          <Plus size={16} />
        )}
        <span>{loading ? 'Creating...' : 'Collaborate'}</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-8 shadow-2xl border border-gray-700 w-full max-w-md relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-white mb-4">Share Collaborative Session</h2>
            {error && <p className="text-red-400 mb-4">{error}</p>}
            {shareLink && (
              <>
                <p className="text-gray-300 mb-4">Share this link with anyone to collaborate:</p>
                <div className="flex items-center space-x-2 mb-6">
                  <input
                    type="text"
                    readOnly
                    value={shareLink}
                    className="flex-1 px-3 py-2 bg-gray-700 rounded-lg text-white text-sm border border-gray-600"
                  />
                  <button
                    onClick={copyLink}
                    className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
                  >
                    {isCopied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
                <button
                  onClick={() => {
                    navigate(`/code/${shareLink.split('/').pop()}`);
                    setShowModal(false);
                  }}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold transition-colors"
                >
                  Go to Editor
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateSessionButton;
