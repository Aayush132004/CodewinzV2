import React, { useState, useEffect } from 'react';
import axiosClient from '../../utils/axiosClient';
import { useParams } from 'react-router';

const ContestSubmission = () => {
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmissionCode, setSelectedSubmissionCode] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { contestId, problemId } = useParams(); // ✅ Corrected here

  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await axiosClient.get(
          `/contest/contestSubmission/${contestId}/${problemId}`
        );
        if(Array.isArray(data)){
        const transformedData = data.map((item) => ({
          submissionId: item._id,
          status: item.status,
          language: item.language,
          code: item.code,
          timestamp: item.updatedAt,
        }));
         setSubmissions(transformedData);
    }
    else{
        const transformedData=[];
         setSubmissions(transformedData);
    }

       
      } catch (err) {
        console.error('Failed to fetch submissions:', err);
        setError('Failed to load submissions. Please try again later.');
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };

    if (contestId && problemId) {
      fetchSubmissions();
    } else {
      setLoading(false);
      setSubmissions([]);
    }
  }, [contestId, problemId]);

  const handleRowClick = (code) => {
    setSelectedSubmissionCode(code);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedSubmissionCode(null);
  };

  return (
    <div className="font-sans min-h-screen bg-gray-900 text-gray-100 p-6 flex flex-col items-center">
      <div className="w-full max-w-4xl bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
        <h1 className="text-3xl font-bold text-center text-purple-400 mb-6">
          Your Submissions for Problem
        </h1>

        {loading ? (
          <p className="text-center text-gray-400">Loading submissions...</p>
        ) : error ? (
          <p className="text-center text-red-400">{error}</p>
        ) : submissions.length === 0 ? (
          <p className="text-center text-gray-400">
            No submissions found for this problem yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="table w-full text-gray-300">
              <thead className="bg-gray-700 text-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">Submission ID</th>
                  <th className="px-4 py-3 text-left">Language</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr
                    key={submission.submissionId}
                    className="hover:bg-gray-700 cursor-pointer transition-colors duration-200"
                    onClick={() => handleRowClick(submission.code)}
                  >
                    <td className="px-4 py-3">{submission.submissionId}</td>
                    <td className="px-4 py-3">{submission.language}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${
                          submission.status === 'Accepted'
                            ? 'badge-success'
                            : submission.status === 'Wrong Answer'
                            ? 'badge-error'
                            : submission.status === 'Time Limit Exceeded'
                            ? 'badge-warning'
                            : submission.status === 'Runtime Error'
                            ? 'badge-info'
                            : ''
                        } badge-outline text-xs`}
                      >
                        {submission.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(submission.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="modal modal-open modal-middle">
          <div className="modal-box bg-gray-800 text-gray-100 rounded-lg shadow-2xl p-6 relative border border-gray-700">
            <h3 className="font-bold text-lg text-purple-400 mb-4">
              Submitted Code
            </h3>
         <div className="max-h-96 overflow-y-auto rounded-md border border-gray-700 bg-gray-950 p-4 relative font-mono shadow-inner">
  <div className="flex items-center gap-2 mb-3 px-2">
    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
  </div>
  <pre className="whitespace-pre-wrap break-words text-sm text-gray-200">
    <code>{selectedSubmissionCode}</code>
  </pre>
</div>
            <div className="modal-action mt-6">
              <button
                className="btn btn-primary btn-outline"
                onClick={closeModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContestSubmission;
