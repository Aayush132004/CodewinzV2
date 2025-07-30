import React, { useState, useEffect } from 'react';
import axiosClient from '../../utils/axiosClient';

const Submissionhistory = ({ problemId }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(`/problem/submittedProblem/${problemId}`);
        
        // Ensure data is an array before setting state
        if (Array.isArray(response.data)) {
          setSubmissions(response.data);
        } else if (response.data) {
          // If it's a single object, wrap it in an array or handle as needed
          setSubmissions([response.data]); 
        } else {
          setSubmissions([]); // No data or unexpected format
        }
        setError(null);
      } catch (err) {
        setError('Failed to fetch submission history. Please try again.');
        console.error("Error fetching submission history:", err);
        setSubmissions([]); // Clear submissions on error
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [problemId]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) { // Ensure status is lowercased for consistent matching
      case 'accepted': return 'bg-green-600 text-white';
      case 'wrong': return 'bg-red-600 text-white';
      case 'error': return 'bg-yellow-600 text-white'; // Changed to yellow for error
      case 'pending': return 'bg-blue-600 text-white'; // Changed to blue for pending
      default: return 'bg-gray-600 text-white';
    }
  };

  const formatMemory = (memory) => {
    if (typeof memory !== 'number') return 'N/A';
    if (memory < 1024) return `${memory} kB`;
    return `${(memory / 1024).toFixed(2)} MB`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      console.error("Invalid date string:", dateString);
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-800 rounded-lg">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error shadow-lg my-4 bg-red-800 text-white rounded-lg">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="ml-2">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-0 bg-gray-900 text-gray-100 rounded-lg shadow-lg"> {/* Removed fixed height, adjusted padding */}
      {(submissions.length === 0) ? ( // Simplified condition
        <div className="alert alert-info shadow-lg bg-blue-800 text-white rounded-lg">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="ml-2">No submissions found for this problem.</span>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="table w-full text-gray-300">
              <thead className="bg-gray-700 text-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">S.No</th>
                  <th className="px-4 py-3 text-left">Language</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Runtime</th>
                  <th className="px-4 py-3 text-left">Memory</th>
                  <th className="px-4 py-3 text-left">Test Cases</th>
                  <th className="px-4 py-3 text-left">Submitted</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub, index) => (
                  <tr key={sub._id || index} className="hover:bg-gray-700 transition-colors duration-200"> {/* Added key and hover */}
                    <td className="px-4 py-3">{index + 1}</td>
                    <td className="px-4 py-3 font-mono text-sm">{sub.language}</td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(sub.status)}`}>
                        {sub.status?.charAt(0).toUpperCase() + sub.status?.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">{sub.runtime ? `${sub.runtime}s` : 'N/A'}</td>
                    <td className="px-4 py-3 font-mono text-sm">{formatMemory(sub.memory)}</td>
                    <td className="px-4 py-3 font-mono text-sm">{sub.testCasesPassed !== undefined && sub.totalTestCases !== undefined ? `${sub.testCasesPassed}/${sub.totalTestCases}` : 'N/A'}</td>
                    <td className="px-4 py-3 text-sm">{formatDate(sub.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button 
                        className="btn btn-sm btn-outline btn-info hover:bg-blue-700 hover:text-white transition-colors duration-200"
                        onClick={() => setSelectedSubmission(sub)}
                      >
                        Code
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-sm text-gray-400 text-center">
            Showing {submissions.length} submissions
          </p>
        </>
      )}

      {/* Code View Modal */}
      {selectedSubmission && (
        <div className="modal modal-open modal-middle"> {/* Ensured modal is middle-aligned */}
          <div className="modal-box w-11/12 max-w-5xl bg-gray-800 text-gray-100 rounded-lg shadow-2xl p-6 relative">
            <h3 className="font-bold text-xl mb-4 text-primary-content">
              Submission Details: <span className="text-blue-400">{selectedSubmission.language}</span>
            </h3>
            
            <div className="mb-4 space-y-2">
              <div className="flex flex-wrap gap-2 items-center">
                <span className={`badge text-sm font-semibold px-3 py-1 rounded-full ${getStatusColor(selectedSubmission.status)}`}>
                  {selectedSubmission.status?.charAt(0).toUpperCase() + selectedSubmission.status?.slice(1)}
                </span>
                <span className="badge badge-outline badge-info text-sm px-3 py-1 rounded-full border-blue-500 text-blue-400">
                  Runtime: {selectedSubmission.runtime ? `${selectedSubmission.runtime}s` : 'N/A'}
                </span>
                <span className="badge badge-outline badge-info text-sm px-3 py-1 rounded-full border-blue-500 text-blue-400">
                  Memory: {formatMemory(selectedSubmission.memory)}
                </span>
                <span className="badge badge-outline badge-info text-sm px-3 py-1 rounded-full border-blue-500 text-blue-400">
                  Test Cases: {selectedSubmission.testCasesPassed !== undefined && selectedSubmission.totalTestCases !== undefined ? `${selectedSubmission.testCasesPassed}/${selectedSubmission.totalTestCases}` : 'N/A'} 
                </span>
              </div>
              
              {selectedSubmission.errorMessage && (
                <div className="alert alert-error bg-red-800 text-white p-3 rounded-md text-sm">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="ml-2">Error: {selectedSubmission.errorMessage}</span>
                  </div>
                </div>
              )}
            </div>
            
            <pre className="p-4 bg-gray-950 text-green-300 rounded-lg overflow-x-auto text-sm border border-gray-700 shadow-inner">
              <code>{selectedSubmission.code}</code>
            </pre>
            
            <div className="modal-action mt-6">
              <button 
                className="btn btn-outline btn-primary hover:bg-purple-700 hover:text-white transition-colors duration-200"
                onClick={() => setSelectedSubmission(null)}
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

export default Submissionhistory;
