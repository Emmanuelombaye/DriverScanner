import { useState, useRef, useEffect } from 'react';
import { ChatBubbleLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';

function AIAssistant({ driver }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await window.electron.invoke('get-ai-suggestion', {
        driver,
        question: userMessage
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-primary-50 rounded-lg">
          <ChatBubbleLeftIcon className="h-6 w-6 text-primary-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">AI Assistant</h2>
          <p className="text-sm text-gray-500">
            {driver ? `Troubleshooting ${driver.name}` : 'Select a driver to begin'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <ChatBubbleLeftIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {driver
                  ? `Ask me anything about ${driver.name}`
                  : 'Select a driver to begin troubleshooting'}
              </p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <ReactMarkdown
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      return !inline ? (
                        <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg my-2 overflow-x-auto">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      ) : (
                        <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props}>
                          {children}
                        </code>
                      );
                    }
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={driver ? "Ask about driver issues..." : "Select a driver first..."}
            className="flex-1 rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
            disabled={isLoading || !driver}
          />
          <button
            type="submit"
            disabled={isLoading || !driver || !input.trim()}
            className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        )}
      </form>
    </div>
  );
}

export default AIAssistant; 