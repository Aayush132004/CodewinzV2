import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import Editor from '@monaco-editor/react';
import { useParams } from 'react-router';
import axiosClient from "../../utils/axiosClient"
import Submissionhistory from '../components/Submissionhistory';
import Editorial from '../components/Editorial';
import ChatAi from '../components/ChatAi';

const ProblemPage = () => {
  const [problem, setProblem] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [activeLeftTab, setActiveLeftTab] = useState('description');
  const [activeRightTab, setActiveRightTab] = useState('code');
  const editorRef = useRef(null);
  let {problemId}  = useParams();

  const getBackendLanguage=(lang)=>{
    if(lang==='cpp') return 'c++';
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
        // console.log(response.data.startCode);
        

        
        setCode(initialCode);
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
      // console.log("hi");
      const response = await axiosClient.post(`/submission/run/${problemId}`, {
        code,
        language:  getBackendLanguage(selectedLanguage)
      });
      console.log(response.data);
      setRunResult(response.data);
      setLoading(false);
      setActiveRightTab('testcase');
      
    } catch (error) {
      console.error('Error running code:', error);
      setRunResult({
        success: false,
        error: 'Internal server error'
      });
      setLoading(false);
      setActiveRightTab('testcase');
    }
  };

  const handleSubmitCode = async () => {
    setLoading(true);
    setSubmitResult(null);
    
    try {
        const response = await axiosClient.post(`/submission/submit/${problemId}`, {
        code:code,
         language:  getBackendLanguage(selectedLanguage)
      });

       setSubmitResult(response.data);
       setLoading(false);
       setActiveRightTab('result');
      
    } catch (error) {
      console.error('Error submitting code:', error);
      setSubmitResult(null);
      setLoading(false);
      setActiveRightTab('result');
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

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'hard': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  if (loading && !problem) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

return (
  <div className="h-screen flex bg-gradient-to-br from-[#0f172a] via-[#1e253b] to-[#1e293b]text-base-content">
    {/* Left Panel */}
    <div className="w-1/2 flex flex-col border-r border-base-300 bg-white/5 backdrop-blur-md shadow-inner">
      {/* Left Tabs */}
      <div className="tabs tabs-lifted px-6 py-3 border-b border-base-300">
        {['description', 'video Solution', 'solutions', 'submissions','chatAI'].map((tab) => (
          <button
            key={tab}
            className={`tab transition duration-200 ease-in-out text-md tracking-wide font-medium px-4 ${activeLeftTab === tab ? 'tab-active text-primary border-b-2 border-primary' : 'hover:text-primary/80'}`}
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
                  <div className={`badge badge-outline px-3 py-1 text-sm ${getDifficultyColor(problem.difficulty)}`}>{problem.difficulty}</div>
                  <div className="badge badge-secondary px-3 py-1 text-sm">{problem.tags}</div>
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

            {activeLeftTab === 'video Solution' && (
              <div className="prose prose-sm max-w-none text-base-content/80 whitespace-pre-wrap">
                <h2 className="text-xl font-semibold mb-4">Editorial</h2>
                <Editorial secureUrl={problem.secureUrl} thumbnailUrl={problem.thumbnailUrl} duration={problem.duration}/>
              </div>
            )}

            {activeLeftTab === 'solutions' && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Solutions</h2>
                {problem.referenceSolution?.length ? (
                  problem.referenceSolution.map((solution, index) => (
                    <div key={index} className="border border-base-300 rounded-lg overflow-hidden shadow-md">
                      <div className="bg-base-300 px-4 py-2 font-semibold">
                        {problem.title} - {solution.language}
                      </div>
                      <pre className="bg-black text-green-200 p-4 overflow-x-auto text-xs">
                        <code>{solution.completeCode}</code>
                      </pre>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Solutions will be available after you solve the problem.</p>
                )}
              </div>
            )}

            {activeLeftTab === 'submissions' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">My Submissions</h2>
               <Submissionhistory problemId={problem._id}/>
              </div>
            )}
               {activeLeftTab === 'chatAI' && (
                <div className="prose max-w-none">
                  <h2 className="text-xl font-bold mb-4">CHAT with AI</h2>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    <ChatAi problem={problem}></ChatAi>
                  </div>
                </div>
              )}
          </>
        )}
      </div>
    </div>

    {/* Right Panel */}
    <div className="w-1/2 flex flex-col bg-base-100">
      {/* Right Tabs */}
      <div className="tabs tabs-lifted px-6 py-3 border-b border-base-300">
        {['code', 'testcase', 'result'].map((tab) => (
          <button
            key={tab}
            className={`tab text-md tracking-wide font-medium px-4 ${activeRightTab === tab ? 'tab-active text-primary border-b-2 border-primary' : 'hover:text-primary/80'}`}
            onClick={() => setActiveRightTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col">
        {activeRightTab === 'code' && (
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-center p-4 bg-base-100 border-b border-base-300">
              <div className="flex gap-2">
                {['javascript', 'java', 'cpp'].map((lang) => (
                  <button
                    key={lang}
                    className={`btn btn-sm rounded-full ${selectedLanguage === lang ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => handleLanguageChange(lang)}
                  >
                    {lang === 'cpp' ? 'c++' : lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[80%]">
              <Editor
                height="100%"
                language={getLanguageForMonaco(selectedLanguage)}
                value={code}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                theme="vs-dark"
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
            <div className=" bg-base-100 border-t border-base-300 flex justify-between">
              
              <div className="flex p-4 pr-8 w-[100%] justify-end gap-10">
                <button className={`btn btn-outline btn-sm ${loading ? 'loading' : ''}`} onClick={handleRun} disabled={loading}>Run</button>
                <button className={`btn btn-primary btn-sm ${loading ? 'loading' : ''}`} onClick={handleSubmitCode} disabled={loading}>Submit</button>
              </div>
            </div>
          </div>
        )}

        {activeRightTab === 'testcase' && (
          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-base-100">
            <h3 className="font-semibold mb-4">Test Results</h3>
            {runResult ? (
              <div className={`alert ${runResult.success ? 'alert-success' : 'alert-error'} shadow-md`}>
                <div>
                  {runResult.success ? (
                  <>
  <div className="text-lg font-bold text-white mb-3">All Test Cases Passed</div>

  <div className="flex flex-wrap gap-4 mb-6">
    <span className="bg-green-700 text-white px-3 py-1 rounded-full text-sm font-semibold shadow">
      Runtime: {runResult.runtime} sec
    </span>
    <span className="bg-blue-700 text-white px-3 py-1 rounded-full text-sm font-semibold shadow">
      Memory: {runResult.memory} KB
    </span>
  </div>

  <div className="space-y-4">
    {runResult.testCases.map((tc, i) => (
      <div
        key={i}
        className="rounded-md bg-[#1f2937] p-4 border border-white/10 text-sm space-y-1 shadow-md"
      >
        <div><strong className="text-white">Input:</strong> <span className="text-white/80">{tc.stdin}</span></div>
        <div><strong className="text-white">Expected:</strong> <span className="text-white/80">{tc.expected_output}</span></div>
        <div><strong className="text-white">Output:</strong> <span className="text-white/80">{tc.stdout}</span></div>
        <div>
          <span
            className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold ${
              tc.status_id === 3
                ? 'bg-green-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            {tc.status_id === 3 ? '✓ Passed' : '✗ Failed'}
          </span>
        </div>
      </div>
    ))}
  </div>
                  </>


                  ) : (
                   <>
  <div className="text-lg font-bold text-error mb-3">Some Test Cases Failed</div>

  <div className="space-y-4">
    {runResult.testCases.map((tc, i) => (
      <div
        key={i}
        className="bg-base-200 border border-base-300 p-4 rounded-lg shadow-sm space-y-2 text-sm"
      >
        <div>
          <span className="font-semibold text-base-content">Input:</span>{' '}
          <span className="text-base-content/80">{tc.stdin}</span>
        </div>
        <div>
          <span className="font-semibold text-base-content">Expected:</span>{' '}
          <span className="text-base-content/80">{tc.expected_output}</span>
        </div>
        <div>
          <span className="font-semibold text-base-content">Output:</span>{' '}
          <span className="text-base-content/80">{tc.stdout}</span>
        </div>
        <div>
          <span
            className={`badge px-3 py-1 text-xs font-bold rounded ${
              tc.status_id === 3
                ? 'badge-success text-white'
                : 'badge-error text-white'
            }`}
          >
            {tc.status_id === 3 ? 'Passed' : 'Failed'}
          </span>
        </div>
      </div>
    ))}
  </div>
                   </>

                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Click "Run" to test your code with the example test cases.</p>
            )}
          </div>
        )}

        {activeRightTab === 'result' && (
          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-base-100">
            <h3 className="font-semibold mb-4">Submission Result</h3>
            {submitResult ? (
              <div className={`alert ${submitResult.accepted ? 'alert-success' : 'alert-error'} shadow-md`}>
                <>
  {submitResult.accepted ? (
    <div className="space-y-4">
      <div className="text-lg font-semibold text-green-800"> Submission Accepted</div>

      <div className="flex flex-wrap gap-3 text-sm text-gray-700">
        <div className="rounded-md bg-green-100 px-3 py-1">
          <strong>Test Cases Passed:</strong> {submitResult.passedTestCases} / {submitResult.totalTestCases}
        </div>
        <div className="rounded-md bg-gray-100 px-3 py-1">
          <strong>Runtime:</strong> {submitResult.runtime} sec
        </div>
        <div className="rounded-md bg-gray-100 px-3 py-1">
          <strong>Memory:</strong> {submitResult.memory} KB
        </div>
      </div>

      <p className="text-sm text-gray-600">
        Your solution has passed all the required test cases and meets the performance constraints.
      </p>
    </div>
  ) : (
    <div className="space-y-4">
      <div className="text-lg font-semibold text-red-700"> Submission Failed</div>

      <p className="text-sm text-gray-700">
        {submitResult.error || "Some test cases did not pass. Please review your logic or performance constraints."}
      </p>

      <div className="flex flex-wrap gap-3 text-sm text-gray-700">
        <div className="rounded-md bg-red-100 px-3 py-1">
          <strong>Test Cases Passed:</strong> {submitResult.passedTestCases} / {submitResult.totalTestCases}
        </div>
      </div>
      </div>
    )}
  </>

              </div>
            ) : (
              <p className="text-gray-500">Click "Submit" to submit your solution for evaluation.</p>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
);



};

export default ProblemPage;