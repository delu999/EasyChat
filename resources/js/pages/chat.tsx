import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { LogIn, MessageSquare, Plus, Send } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export default function ChatInterface() {
    const [sessionId, setSessionId] = useState<string>('');
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    // On component mount, retrieve or create a session ID and fetch conversation history
    useEffect(() => {
        // 1) Retrieve or create a session ID
        let storedSessionId = localStorage.getItem('sessionId') ?? '';
        if (!storedSessionId) {
            storedSessionId = 'a'; // or any method to generate a unique ID
            localStorage.setItem('sessionId', storedSessionId);
        }
        setSessionId(storedSessionId);

        // 2) Fetch existing conversation messages for this session
        fetch('/chat/get-conversation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
            },
            body: JSON.stringify({ session_id: storedSessionId }),
        })
            .then((response) => response.json())
            .then((data: ChatMessage[]) => {
                // data should be an array of messages from your DB
                setMessages(data);
            })
            .catch((error) => {
                console.error('Error fetching conversation:', error);
            });
    }, []);

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        // Immediately show the user's message in the UI
        const userMessage: ChatMessage = { role: 'user', content: input };
        setMessages((prev) => [...prev, userMessage]);

        try {
            // Send the user message to the backend
            const response = await fetch('/chat/store-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                },
                body: JSON.stringify({
                    text: input,
                    session_id: sessionId,
                }),
            });

            const data = await response.json();
            // Expecting data to contain { userMessage, assistantMessage } from the server
            const { userMessage: savedUserMessage, assistantMessage } = data;
            console.log(savedUserMessage);
            // We already displayed the user message in local state, but you could update it
            // if you need the ID or timestamps from the DB:
            // setMessages((prev) => [...prev.slice(0, -1), savedUserMessage]);

            // Display the assistant's response
            if (assistantMessage) {
                setMessages((prev) => [...prev, assistantMessage]);
            }
        } catch (error) {
            console.error('Error storing message or fetching AI response:', error);
        }

        setInput('');
    };

    return (
        <div className="dark flex h-screen">
            <div className="flex h-full w-full flex-col dark:bg-gray-900">
                {/* Main layout */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div className="flex w-64 flex-shrink-0 flex-col border-r dark:border-gray-800 dark:bg-gray-950">
                        <div className="p-4">
                            <Button
                                variant="outline"
                                className="w-full justify-start gap-2 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
                            >
                                <LogIn size={16} />
                                <span>Login</span>
                            </Button>
                            <Button className="mt-4 w-full justify-start gap-2 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">
                                <Plus size={16} />
                                <span>New Chat</span>
                            </Button>
                        </div>
                        <Separator className="dark:bg-gray-800" />
                        <div className="flex-1 overflow-auto p-2">
                            <h2 className="px-2 py-1 text-xs font-semibold dark:text-gray-400">Recent Chats</h2>
                            {['Machine Learning Basics', 'JavaScript Help', 'Travel Recommendations', 'Recipe Ideas', 'Book Suggestions'].map(
                                (chat, index) => (
                                    <Button
                                        key={index}
                                        variant="ghost"
                                        className="mb-1 w-full justify-start px-2 py-2 text-left dark:text-gray-200 dark:hover:bg-gray-800"
                                    >
                                        <MessageSquare size={16} className="mr-2 flex-shrink-0 dark:text-gray-400" />
                                        <span className="truncate">{chat}</span>
                                    </Button>
                                ),
                            )}
                        </div>
                    </div>

                    {/* Chat area */}
                    <div className="flex flex-1 flex-col dark:bg-gray-900">
                        {/* Chat messages */}
                        <div className="flex-1 overflow-auto p-4">
                            {messages.map((message, index) => (
                                <div key={index} className={`mb-4 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={`max-w-3xl rounded-lg p-3 ${
                                            message.role === 'user' ? 'dark:bg-gray-700 dark:text-gray-100' : 'dark:bg-gray-800 dark:text-gray-100'
                                        }`}
                                    >
                                        {message.content}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Input area */}
                        <div className="border-t p-4 dark:border-gray-800">
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Type your message here..."
                                        className="pr-3 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                    />
                                </div>
                                <Button
                                    size="icon"
                                    className="h-10 w-10 flex-shrink-0 dark:bg-gray-700 dark:hover:bg-gray-600"
                                    onClick={handleSendMessage}
                                >
                                    <Send size={16} className="dark:text-gray-200" />
                                </Button>
                            </div>
                            <p className="mt-2 text-center text-xs dark:text-gray-400">
                                AI may produce inaccurate information about people, places, or facts.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
