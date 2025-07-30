import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Send, Lightbulb, Code, BookOpen, Play, Copy, Check, MessageSquare, Bot, User, Brain } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";

function ChatAi({ problem }) {
  const [messages, setMessages] = useState([
    {
      role: "model",
      parts: [{ text: "Hey there! I'm your DSA tutor, ready to help you crush this problem! What would you like to explore first?" }],
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);

  const { register, handleSubmit, reset, watch } = useForm();
  const messagesEndRef = useRef(null);
  const inputValue = watch("message", "");
  const typingIntervalRef = useRef(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingText]);

  // Cleanup typing interval on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  const simulateTyping = (text, callback) => {
    // Clear any existing typing interval
    if (typingIntervalRef.current) {
      clearTimeout(typingIntervalRef.current);
    }
    
    setTypingText("");
    let currentIndex = 0;
    
    const typeNextCharacter = () => {
      if (currentIndex < text.length) {
        setTypingText(text.substring(0, currentIndex + 1));
        currentIndex++;
        
        // Variable typing speed - faster for spaces, slower for punctuation
        const char = text[currentIndex - 1];
        let delay = 30; // Base delay
        
        if (char === ' ') delay = 15; // Faster for spaces
        else if (['.', '!', '?', '\n'].includes(char)) delay = 100; // Slower for punctuation
        else if ([',', ';', ':'].includes(char)) delay = 50; // Medium for other punctuation
        
        typingIntervalRef.current = setTimeout(typeNextCharacter, delay);
      } else {
        // Typing complete
        setTypingText("");
        if (callback) callback();
      }
    };
    
    typeNextCharacter();
  };

  const onSubmit = async (data) => {
    if (!data.message.trim()) return;

    const userMessage = { role: "user", parts: [{ text: data.message }] };
    setMessages(prev => [...prev, userMessage]);
    reset({ message: "" });
    
    // Show thinking indicator
    setIsThinking(true);
    setIsLoading(true);

    try {
      // Add a small delay to show thinking state
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          title: problem.title,
          description: problem.description,
          testCases: problem.visibleTestCases,
          startCode: problem.startCode,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setIsThinking(false);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";

      // Add empty model message for typing effect
      const modelPlaceholder = { role: "model", parts: [{ text: "" }] };
      setMessages(prev => [...prev, modelPlaceholder]);

      // Collect all chunks first
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const textChunk = decoder.decode(value, { stream: true });
        accumulatedText += textChunk;
      }

      // Now simulate typing the complete response once
      simulateTyping(accumulatedText, () => {
        setMessages(prevMessages => {
          const newMessages = [...prevMessages];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.role === "model") {
            lastMessage.parts[0].text = accumulatedText;
          }
          return newMessages;
        });
      });

    } catch (error) {
      console.error("API Error:", error);
      setIsThinking(false);
      setMessages(prev => {
        const errorMessage = { role: "model", parts: [{ text: "Sorry, I encountered an error. Please try again." }] };
        return [...prev, errorMessage];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    const quickMessages = {
      hint: "Can you give me a hint for this problem?",
      approach: "Explain the approach to solve this problem step by step",
      solution: "Show me the complete solution with explanation",
      optimize: "How can I optimize my current solution?"
    };

    if (quickMessages[action]) {
      reset({ message: quickMessages[action] });
      handleSubmit(onSubmit)();
    }
  };

  const copyToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      } catch (execErr) {
        console.error('Fallback copy failed:', execErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const quickActions = [
    { id: 'hint', text: "Give me a hint", icon: Lightbulb, color: "from-yellow-500 to-orange-500" },
    { id: 'approach', text: "Explain approach", icon: BookOpen, color: "from-blue-500 to-cyan-500" },
    { id: 'solution', text: "Show solution", icon: Code, color: "from-green-500 to-emerald-500" },
    { id: 'optimize', text: "Help optimize", icon: Play, color: "from-purple-500 to-pink-500" }
  ];

  const markdownComponents = {
    p: ({ node, ...props }) => <p className="mb-2 last:mb-0 break-words" {...props} />,
    code: ({ node, inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : 'text';

      if (!inline && match) {
        return (
          <div className="bg-[#282c34] rounded-lg my-2 overflow-hidden shadow-lg border border-[#3b4048]">
            <div className="flex items-center p-2 border-b border-[#3b4048]">
              <div className="flex space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
              </div>
              <span className="ml-3 text-xs text-gray-400 font-mono uppercase">{language}</span>
            </div>
            <SyntaxHighlighter
              style={atomOneDark}
              language={language}
              PreTag="div"
              customStyle={{
                margin: 0,
                padding: '1rem',
                backgroundColor: 'transparent',
                overflowX: 'auto',
                fontSize: '0.875rem',
                lineHeight: '1.5',
                wordBreak: 'break-all',
                whiteSpace: 'pre-wrap',
              }}
              codeTagProps={{
                style: {
                  fontFamily: 'monospace',
                }
              }}
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          </div>
        );
      }
      return <code {...props}>{children}</code>;
    },
    h1: ({ node, ...props }) => <h1 className="text-xl font-bold mt-4 mb-2 text-primary-content" {...props} />,
    h2: ({ node, ...props }) => <h2 className="text-lg font-semibold mt-3 mb-1 text-primary-content" {...props} />,
    ul: ({ node, ...props }) => <ul className="list-disc list-inside ml-4 mb-2" {...props} />,
    ol: ({ node, ...props }) => <ol className="list-decimal list-inside ml-4 mb-2" {...props} />,
    li: ({ node, ...props }) => <li className="mb-1" {...props} />,
    strong: ({ node, ...props }) => <strong className="font-bold text-white" {...props} />,
    em: ({ node, ...props }) => <em className="italic text-gray-300" {...props} />,
    a: ({ node, ...props }) => <a className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50 backdrop-blur-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800/80 to-gray-700/80 backdrop-blur-sm p-4 border-b border-gray-600/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">DSA Bot</h3>
            <p className="text-xs text-gray-300">
              {isThinking ? "Thinking..." : "Ready to help you ace this problem!"}
            </p>
          </div>
          {(isThinking || isLoading) && (
            <div className="ml-auto">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Brain className="w-4 h-4 animate-pulse text-purple-400" />
                <span className="animate-pulse">Processing...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 bg-gray-800/30 border-b border-gray-700/50">
        <p className="text-xs text-gray-400 mb-3 font-medium">Quick Actions:</p>
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action.id)}
              className={`flex items-center justify-center gap-2 p-2 rounded-lg bg-gradient-to-r ${action.color} bg-opacity-10 hover:bg-opacity-20 text-white text-xs font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg border border-gray-600/30`}
              disabled={isLoading}
            >
              <action.icon className="w-3 h-3" />
              {action.text}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fadeIn`}
          >
            <div className={`group relative max-w-[85%] p-4 rounded-2xl shadow-lg transition-all duration-300 ease-out hover:shadow-xl ${
              msg.role === "user"
                ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-md border border-blue-500/30"
                : "bg-gradient-to-br from-gray-700/80 to-gray-800/80 text-gray-100 rounded-bl-md border border-gray-600/30 backdrop-blur-sm"
            } break-words`}>
              
              {/* Message Header */}
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  msg.role === "user" 
                    ? "bg-blue-500/30" 
                    : "bg-gradient-to-r from-purple-500 to-pink-500"
                }`}>
                  {msg.role === "user" ? 
                    <User className="w-3 h-3" /> : 
                    <Bot className="w-3 h-3" />
                  }
                </div>
                <span className="text-xs font-medium opacity-80">
                  {msg.role === "user" ? "You" : "DSA Bot"}
                </span>
                
                {/* Copy button for AI messages */}
                {msg.role === "model" && msg.parts[0].text && (
                  <button
                    onClick={() => copyToClipboard(msg.parts[0].text, index)}
                    className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-600/50 rounded"
                  >
                    {copiedIndex === index ? 
                      <Check className="w-3 h-3 text-green-400" /> : 
                      <Copy className="w-3 h-3" />
                    }
                  </button>
                )}
              </div>

              {/* Message Content */}
              <div className="text-sm leading-relaxed">
                <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
                  {msg.parts[0].text}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}

        {/* Thinking indicator */}
        {isThinking && (
          <div className="flex justify-start">
            <div className="max-w-[85%] p-4 rounded-2xl bg-gradient-to-br from-gray-700/80 to-gray-800/80 border border-gray-600/30 backdrop-blur-sm rounded-bl-md">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <Brain className="w-3 h-3 animate-pulse" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-300">Thinking</span>
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Typing indicator with live text */}
        {typingText && (
          <div className="flex justify-start">
            <div className="max-w-[85%] p-4 rounded-2xl bg-gradient-to-br from-gray-700/80 to-gray-800/80 border border-gray-600/30 backdrop-blur-sm rounded-bl-md">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <Bot className="w-3 h-3" />
                </div>
                <span className="text-xs font-medium opacity-80">DSA Bot</span>
                <div className="ml-auto flex items-center gap-1">
                  <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400">typing...</span>
                </div>
              </div>
              <div className="text-sm leading-relaxed">
                <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
                  {typingText}
                </ReactMarkdown>
                <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1" style={{ animation: 'blink 1s infinite' }} />
              </div>
            </div>
          </div>
        )}

        {/* Standard typing indicator for empty responses */}
        {isLoading && !isThinking && !typingText && 
          messages[messages.length - 1]?.role === "model" &&
          messages[messages.length - 1]?.parts[0].text === "" && (
            <div className="flex justify-start">
              <div className="max-w-[85%] p-4 rounded-2xl bg-gradient-to-br from-gray-700/80 to-gray-800/80 border border-gray-600/30 backdrop-blur-sm rounded-bl-md">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <Bot className="w-3 h-3" />
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Section */}
      <div className="p-4 bg-gradient-to-r from-gray-800/50 to-gray-700/50 backdrop-blur-sm border-t border-gray-600/50">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              placeholder="Ask me anything about the problem... 💭"
              className="w-full p-3 pl-4 pr-12 bg-gray-700/50 backdrop-blur-sm text-gray-100 border border-gray-600/50 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 rounded-xl placeholder-gray-400 transition-all duration-200 text-sm"
              {...register("message", { required: true, minLength: 2 })}
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(onSubmit)();
                }
              }}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <MessageSquare className="w-4 h-4 text-gray-400" />
            </div>
          </div>
          
          <button
            onClick={handleSubmit(onSubmit)}
            className={`p-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl ${
              inputValue.trim() && !isLoading
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:scale-105"
                : "bg-gray-600/50 text-gray-400 cursor-not-allowed"
            }`}
            disabled={!inputValue.trim() || isLoading}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default ChatAi;