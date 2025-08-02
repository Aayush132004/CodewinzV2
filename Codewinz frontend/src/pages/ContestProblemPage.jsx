import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import Editor from '@monaco-editor/react';
import { useParams } from 'react-router';
import axiosClient from "../../utils/axiosClient"
import Contestsubmissionhistory from '../components/Contestsubmissionhistory';

const ContestProblemPage = () => {
  const [problem, setProblem] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [activeLeftTab, setActiveLeftTab] = useState('description');
  const [selectedTheme, setSelectedTheme] = useState('vs-dark');
  const [testCaseResults, setTestCaseResults] = useState([]);
  const editorRef = useRef(null);

  //problem id from params
  let {contestId, problemId} = useParams();

  const handleThemeChange = (theme) => {
    setSelectedTheme(theme);
  };

  const getBackendLanguage = (lang) => {
    if(lang === 'cpp') return 'c++';
    else return lang;
  }

  const { handleSubmit } = useForm();

  //first bringing the problem from its id all its detail
  useEffect(() => {
    const fetchProblem = async () => {
      setLoading(true);
      try {
        const response = await axiosClient.get(`/problem/problemById/${problemId}`);
        
        console.log(response.data.thumbnailUrl);
        const initialCode = response.data.startCode.find((sc) => {
          if (sc.language == "c++" && selectedLanguage == 'cpp')
            return true;
          else if (sc.language == "java" && selectedLanguage == 'java')
            return true;
          else if (sc.language == "javascript" && selectedLanguage == 'javascript')
            return true;
          return false;
        })?.initialCode || '';

        setProblem(response.data);
        setCode(initialCode);
        
        // Initialize test case results with visible test cases
        if (response.data.visibleTestCases) {
          setTestCaseResults(response.data.visibleTestCases.map((testCase, index) => ({
            id: index,
            input: testCase.input,
            expectedOutput: testCase.output,
            explanation: testCase.explanation,
            actualOutput: null,
            status: 'pending',
            runtime: null,
            memory: null
          })));
        }
        
        setLoading(false);
        
      } catch (error) {
        console.error('Error fetching problem:', error);
        setLoading(false);
      }
    };

    fetchProblem();
  }, [problemId]);

  // Update code when language changes
  useEffect(() => {
    if (problem) {
      const initialCode = problem.startCode.find((sc) => {
        if (sc.language == "c++" && selectedLanguage == 'cpp')
          return true;
        else if (sc.language == "java" && selectedLanguage == 'java')
          return true;
        else if (sc.language == "javascript" && selectedLanguage == 'javascript')
          return true;
        return false;
      })?.initialCode || '';
      setCode(initialCode);
    }
  }, [selectedLanguage, problem]);

  const handleEditorChange = (value) => {
    setCode(value || '');
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
  };

  const handleRun = async () => {
    setLoading(true);
    setRunResult(null);
    
    try {
      const response = await axiosClient.post(`/submission/run/${problemId}`, {
        code,
        language: getBackendLanguage(selectedLanguage)
      });
      
      setRunResult(response.data);
      
      // Update test case results with actual run data
      if (response.data.testCases && testCaseResults.length > 0) {
        const updatedTestCases = testCaseResults.map((testCase, index) => {
          const result = response.data.testCases[index];
          if (result) {
            return {
              ...testCase,
              actualOutput: result.stdout || result.output || '',
              status: result.status_id === 3 ? 'passed' : 'failed',
              runtime: result.time || response.data.runtime,
              memory: result.memory || response.data.memory,
              error: result.stderr || result.compile_output || null
            };
          }
          return testCase;
        });
        setTestCaseResults(updatedTestCases);
      }
      
      setLoading(false);
      setActiveLeftTab('testcase');
      
    } catch (error) {
      console.error('Error running code:', error);
      setRunResult({
        status: 'error',
        error: 'Internal server error'
      });
      
      // Update test cases to show error state
      const errorTestCases = testCaseResults.map(testCase => ({
        ...testCase,
        status: 'failed',
        actualOutput: 'Error occurred',
        error: 'Internal server error'
      }));
      setTestCaseResults(errorTestCases);
      
      setLoading(false);
      setActiveLeftTab('testcase');
    }
  };

  const handleSubmitCode = async () => {
    setLoading(true);
    setSubmitResult(null);
    
    try {
      const response = await axiosClient.post(`/contest/contestSubmission/submit/${problemId}`, {
        code: code,
        contestId: contestId,
        points: getPoints(problem.difficulty),
        language: getBackendLanguage(selectedLanguage)
      });

      setSubmitResult(response.data);
      setLoading(false);
      setActiveLeftTab('result');
      
    } catch (error) {
      console.error('Error submitting code:', error);
      setSubmitResult({
        status: 'error',
        error: error.response?.data?.message || 'Internal server error',
        passedTestCases: 0,
        totalTestCases: 0
      });
      setLoading(false);
      setActiveLeftTab('result');
    }
  };

  const getLanguageForMonaco = (lang) => {
    switch (lang) {
      case 'javascript': return 'javascript';
      case 'java': return 'java';
      case 'cpp': return 'cpp';
      default: return 'javascript';
    }
  };

  const getPoints = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 20;
      case 'medium': return 50;
      case 'hard': return 100;
      default: return 20;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed':
        return <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case 'failed':
        return <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      default:
        return <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    }
  };

  const getTestStatusBadge = (status) => {
    switch (status) {
      case 'passed':
        return <span className="badge badge-success text-white text-xs px-2 py-1">Passed</span>;
      case 'failed':
        return <span className="badge badge-error text-white text-xs px-2 py-1">Failed</span>;
      default:
        return <span className="badge badge-ghost text-xs px-2 py-1">Pending</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return <span className="badge badge-success text-white font-semibold">✓ Accepted</span>;
      case 'error':
      case 'failed':
        return <span className="badge badge-error text-white font-semibold">✗ Failed</span>;
      case 'wrong answer':
        return <span className="badge badge-warning text-white font-semibold">⚠ Wrong Answer</span>;
      case 'time limit exceeded':
        return <span className="badge badge-error text-white font-semibold">⏱ Time Limit</span>;
      case 'memory limit exceeded':
        return <span className="badge badge-error text-white font-semibold">💾 Memory Limit</span>;
      case 'runtime error':
        return <span className="badge badge-error text-white font-semibold">🔥 Runtime Error</span>;
      default:
        return <span className="badge badge-neutral text-white font-semibold">❓ Unknown</span>;
    }
  };

  if (loading && !problem) {
    return (
      <div className="flex bg-gradient-to-br from-[#0f172a] via-[#1e253b] to-[#1e293b] justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gradient-to-br from-[#0f172a] via-[#1e253b] to-[#1e293b] text-base-content">
      {/* Left Panel */}
      <div className="w-1/2 flex flex-col border-r border-base-300 bg-white/5 backdrop-blur-md shadow-inner">
        {/* Left Tabs */}
        <div className="tabs tabs-lifted px-6 py-3 border-b border-base-300">
          {['description', 'testcase', 'result', 'submissions'].map((tab) => (
            <button
              key={tab}
              className={`tab transition duration-200 ease-in-out text-md tracking-wide font-medium px-4 ${
                activeLeftTab === tab 
                  ? 'tab-active text-primary border-b-2 border-primary' 
                  : 'hover:text-primary/80'
              }`}
              onClick={() => setActiveLeftTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Left Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {problem && (
            <>
              {activeLeftTab === 'description' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <h1 className="text-3xl font-extrabold text-primary-content drop-shadow-sm">{problem.title}</h1>
                    <div className="badge badge-outline px-3 py-1 text-sm">
                      {getPoints(problem.difficulty) + " points"}
                    </div>
                  </div>

                  <div className="prose prose-sm max-w-none prose-p:text-base-content/80 whitespace-pre-wrap leading-relaxed">
                    {problem.description}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Examples:</h3>
                    <div className="grid gap-4">
                      {problem.visibleTestCases.map((example, index) => (
                        <div key={index} className="rounded-xl bg-base-200/60 p-5 border border-base-300 shadow-sm">
                          <h4 className="font-semibold text-base-content mb-2">Example {index + 1}:</h4>
                          <div className="space-y-1 font-mono text-xs">
                            <div><strong>Input:</strong> {example.input}</div>
                            <div><strong>Output:</strong> {example.output}</div>
                            <div><strong>Explanation:</strong> {example.explanation}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeLeftTab === 'testcase' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-primary-content">Test Cases</h3>
                    {runResult && (
                      <div className="flex gap-2 text-sm">
                        <span className="bg-gray-700 px-2 py-1 rounded text-gray-300">
                          Runtime: {runResult.runtime || 'N/A'} sec
                        </span>
                        <span className="bg-gray-700 px-2 py-1 rounded text-gray-300">
                          Memory: {runResult.memory || 'N/A'} KB
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {testCaseResults.map((testCase, index) => (
                      <div
                        key={testCase.id}
                        className={`rounded-lg p-4 border shadow-sm transition-all duration-200 ${
                          testCase.status === 'passed' 
                            ? 'bg-green-900/20 border-green-700/50' 
                            : testCase.status === 'failed'
                            ? 'bg-red-900/20 border-red-700/50'
                            : 'bg-gray-700/20 border-gray-600/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-200 flex items-center gap-2">
                            {getStatusIcon(testCase.status)}
                            Test Case {index + 1}
                          </h4>
                          {getTestStatusBadge(testCase.status)}
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-300">
                          <div>
                            <strong className="text-blue-300">Input:</strong>
                            <pre className="bg-gray-800 p-2 rounded mt-1 text-xs overflow-x-auto">{testCase.input}</pre>
                          </div>
                          
                          <div>
                            <strong className="text-green-300">Expected Output:</strong>
                            <pre className="bg-gray-800 p-2 rounded mt-1 text-xs overflow-x-auto">{testCase.expectedOutput}</pre>
                          </div>
                          
                          {testCase.actualOutput !== null && (
                            <div>
                              <strong className={testCase.status === 'passed' ? 'text-green-300' : 'text-red-300'}>
                                Your Output:
                              </strong>
                              <pre className={`p-2 rounded mt-1 text-xs overflow-x-auto ${
                                testCase.status === 'passed' ? 'bg-green-900/30' : 'bg-red-900/30'
                              }`}>
                                {testCase.actualOutput || 'No output'}
                              </pre>
                            </div>
                          )}
                          
                          {testCase.explanation && (
                            <div>
                              <strong className="text-yellow-300">Explanation:</strong>
                              <p className="bg-gray-800 p-2 rounded mt-1 text-xs">{testCase.explanation}</p>
                            </div>
                          )}
                          
                          {testCase.error && (
                            <div>
                              <strong className="text-red-300">Error:</strong>
                              <pre className="bg-red-900/30 p-2 rounded mt-1 text-xs overflow-x-auto">{testCase.error}</pre>
                            </div>
                          )}
                          
                          {testCase.status !== 'pending' && (testCase.runtime || testCase.memory) && (
                            <div className="flex gap-4 mt-2 text-xs text-gray-400">
                              {testCase.runtime && <span>Runtime: {testCase.runtime} sec</span>}
                              {testCase.memory && <span>Memory: {testCase.memory} KB</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {testCaseResults.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🧪</div>
                      <p className="text-lg text-gray-500 mb-2">No test cases available</p>
                      <p className="text-sm text-gray-400">Test cases will appear here after loading the problem</p>
                    </div>
                  )}
                  
                  {testCaseResults.every(tc => tc.status === 'pending') && testCaseResults.length > 0 && (
                    <div className="text-center py-4">
                      <p className="text-gray-500 text-sm">Click "Run" to test your code with these test cases.</p>
                    </div>
                  )}
                </div>
              )}

              {activeLeftTab === 'result' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold mb-4 text-primary-content">Submission Result</h3>
                  {submitResult ? (
                    <div className={`rounded-lg p-4 shadow-md ${submitResult?.status === "accepted" ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
                      <div className={`flex items-center gap-2 mb-3 ${submitResult?.status === "accepted" ? 'text-green-400' : 'text-red-400'}`}>
                        {submitResult?.status === "accepted" ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        )}
                        <span className="text-lg font-bold">
                          {submitResult?.status === "accepted" ? 'Submission Accepted' : `${submitResult?.status ? submitResult?.status : "Submission Failed"}`}
                        </span>
                      </div>

                      <p className="text-sm text-gray-300 mb-4">
                        {submitResult?.status === "accepted"
                          ? `Your solution has passed all test cases and meets the performance constraints. You've earned ${getPoints(problem.difficulty)} points for this contest problem!`
                          : submitResult.error || "Some test cases did not pass. Please review your logic or performance constraints."
                        }
                      </p>

                      <div className="flex flex-wrap gap-3 text-sm text-gray-300">
                        <div className="rounded-md bg-gray-700 px-3 py-1 shadow-inner">
                          <strong>Test Cases Passed:</strong> {submitResult.passedTestCases || 0} / {submitResult.totalTestCases || 0}
                        </div>
                        <div className="rounded-md bg-gray-700 px-3 py-1 shadow-inner">
                          <strong>Runtime:</strong> {submitResult.runtime || 'N/A'} sec
                        </div>
                        <div className="rounded-md bg-gray-700 px-3 py-1 shadow-inner">
                          <strong>Memory:</strong> {submitResult.memory || 'N/A'} KB
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📝</div>
                      <p className="text-lg text-gray-500 mb-2">No submission yet</p>
                      <p className="text-sm text-gray-400">Click "Submit" to submit your solution for evaluation</p>
                    </div>
                  )}
                </div>
              )}

              {activeLeftTab === 'submissions' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">My Submissions</h2>
                  <Contestsubmissionhistory problemId={problem._id} contestId={contestId}/>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right Panel - Code Editor */}
      <div className="w-1/2 flex flex-col bg-base-100">
        {/* Code Header */}
        <div className="flex justify-between items-center p-4 bg-base-100 border-b border-base-300">
          <div className="flex gap-4 items-center w-full justify-between">
            {/* Language Dropdown */}
            <div className="relative">
              <select
                className="select select-sm bg-gray-800 text-white border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
              >
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>
            </div>

            {/* Theme Dropdown */}
            <div className="relative">
              <select
                className="select select-sm bg-gray-800 text-white border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
                value={selectedTheme}
                onChange={(e) => handleThemeChange(e.target.value)}
              >
                {[
                  'vs-dark',     // Dark theme (default dark)
                  'vs-light',    // Light theme (default light)
                  'hc-black',    // High-contrast dark theme
                  'hc-light'     // High-contrast light theme
                ].map((theme) => (
                  <option key={theme} value={theme}>
                    {theme.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Code Editor */}
        <div className="flex-1 rounded-2xl border border-[#2c3e50] bg-[#0f172a] shadow-md overflow-hidden">
          <Editor
            height="100%"
            language={getLanguageForMonaco(selectedLanguage)}
            value={code}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            theme={selectedTheme}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              wordWrap: 'on',
              lineNumbers: 'on',
              glyphMargin: false,
              folding: true,
              renderLineHighlight: 'line',
              selectOnLineNumbers: true,
              readOnly: false,
              cursorStyle: 'line',
              mouseWheelZoom: true,
            }}
          />
        </div>

        {/* Action Buttons */}
        <div className="bg-base-100 border-t border-base-300 flex justify-between">
          <div className="flex p-4 pr-8 w-[100%] justify-end gap-10">
            <button 
              className={`btn btn-outline btn-sm ${loading ? 'loading' : ''}`} 
              onClick={handleRun} 
              disabled={loading}
            >
              {loading ? 'Running...' : 'Run'}
            </button>
            <button 
              className={`btn btn-primary btn-sm ${loading ? 'loading' : ''}`} 
              onClick={handleSubmitCode} 
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContestProblemPage;