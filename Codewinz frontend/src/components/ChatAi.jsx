import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Send } from "lucide-react";

function ChatAi({ problem }) {
  const [messages, setMessages] = useState([
    {
      role: "model",
      parts: [{ text: "Hello! How may I help you today?" }],
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const messagesEndRef = useRef(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onSubmit = async (data) => {
    const userMessage = { role: "user", parts: [{ text: data.message }] };
    const modelPlaceholder = { role: "model", parts: [{ text: "" }] };

    const updatedMessages = [...messages, userMessage, modelPlaceholder];

    // Set both user message + placeholder in one go
    setMessages(updatedMessages);
    reset();
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:3000/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages,
          title: problem.title,
          description: problem.description,
          testCases: problem.visibleTestCases,
          startCode: problem.startCode,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const textChunk = decoder.decode(value);

        setMessages((prevMessages) => {
          const newMessages = [...prevMessages];
          const lastMessage = newMessages[newMessages.length - 1];

          if (lastMessage && lastMessage.role === "model") {
            lastMessage.parts[0].text += textChunk;
          }

          return newMessages;
        });
      }
    } catch (error) {
      console.error("API Error:", error);
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.role === "model") {
          lastMessage.parts[0].text = "Sorry, I encountered an error. Please try again.";
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-[80vh] min-h-[500px]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`chat ${msg.role === "user" ? "chat-end" : "chat-start"}`}
          >
            <div className="chat-bubble bg-base-200 text-base-content whitespace-pre-wrap">
              {msg.parts[0].text}
            </div>
          </div>
        ))}

        {/* Typing dots when waiting for AI */}
        {isLoading &&
          messages[messages.length - 1]?.role === "model" &&
          messages[messages.length - 1]?.parts[0].text === "" && (
            <div className="chat chat-start">
              <div className="chat-bubble bg-base-200 text-base-content">
                <span className="loading loading-dots loading-md"></span>
              </div>
            </div>
          )}

        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="sticky bottom-0 p-4 bg-base-100 border-t"
      >
        <div className="flex items-center">
          <input
            placeholder="Ask me anything"
            className="input input-bordered flex-1"
            {...register("message", { required: true, minLength: 2 })}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="btn btn-ghost ml-2"
            disabled={!!errors.message || isLoading}
          >
            {isLoading ? (
              <span className="loading loading-spinner"></span>
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatAi;
