import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { LogIn, Menu, MessageSquare, Plus, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatSession {
    id: string;
    title: string;
}

export default function ChatInterface() {
    const [sessionId, setSessionId] = useState<string>('');
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isResponding, setIsResponding] = useState(false);
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);

    // On component mount, load chat sessions from the backend
    useEffect(() => {
        fetch('/chat/sessions', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-CSRF-TOKEN': document
                    .querySelector('meta[name="csrf-token"]')
                    ?.getAttribute('content') ?? '',
            },
        })
            .then((response) => response.json())
            .then((data: ChatSession[]) => {
                setChatSessions(data);
                if (data.length > 0) {
                    const storedSessionId = localStorage.getItem('sessionId');
                    if (storedSessionId && data.find(session => session.id === storedSessionId)) {
                        // Stored session is valid
                        setSessionId(storedSessionId);
                        fetchConversation(storedSessionId);
                    } else {
                        // Use the first session from the list
                        setSessionId(data[0].id);
                        localStorage.setItem('sessionId', data[0].id);
                        fetchConversation(data[0].id);
                    }
                } else {
                    // No sessions found, create a new one
                    handleNewChat();
                }
            })
            .catch((error) => {
                console.error('Error fetching chat sessions:', error);
                // In case of error, create a new session
                handleNewChat();
            });
    }, []);

    const fetchConversation = (session: string) => {
        fetch('/chat/get-conversation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-CSRF-TOKEN': document
                    .querySelector('meta[name="csrf-token"]')
                    ?.getAttribute('content') ?? '',
            },
            body: JSON.stringify({ session_id: session }),
        })
            .then((response) => response.json())
            .then((data: ChatMessage[]) => {
                setMessages(data);
            })
            .catch((error) => {
                console.error('Error fetching conversation:', error);
            });
    };

    const handleNewChat = async () => {
        try {
            const response = await fetch('/chat/session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': document
                        .querySelector('meta[name="csrf-token"]')
                        ?.getAttribute('content') ?? '',
                },
                body: JSON.stringify({ title: 'New Chat' }),
            });
            const newSession: ChatSession = await response.json();
            setChatSessions((prev) => [newSession, ...prev]);
            setSessionId(newSession.id);
            localStorage.setItem('sessionId', newSession.id);
            setMessages([]);
        } catch (error) {
            console.error('Error creating new session:', error);
        }
    };

    const loadConversation = (newSessionId: string) => {
        setSessionId(newSessionId);
        localStorage.setItem('sessionId', newSessionId);
        fetchConversation(newSessionId);
    };

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const userMessage: ChatMessage = { role: 'user', content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsResponding(true);

        try {
            const response = await fetch('/chat/store-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': document
                        .querySelector('meta[name="csrf-token"]')
                        ?.getAttribute('content') ?? '',
                },
                body: JSON.stringify({ text: userMessage.content, session_id: sessionId }),
            });
            const data = await response.json();
            const { assistantMessage } = data;
            if (assistantMessage) {
                setMessages((prev) => [...prev, assistantMessage]);
            }
        } catch (error) {
            console.error('Error storing message or fetching AI response:', error);
        } finally {
            setIsResponding(false);
        }
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="dark flex h-screen">
            <div className="flex h-full w-full flex-col dark:bg-gray-900">
                <div className="relative flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div
                        className={`fixed z-20 flex h-full w-64 flex-shrink-0 flex-col border-r transition-all duration-300 ease-in-out md:relative dark:border-gray-800 dark:bg-gray-950 ${
                            isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:-translate-x-0'
                        } ${!isSidebarOpen ? 'md:w-0 md:overflow-hidden md:border-r-0' : 'md:w-64'}`}
                    >
                        <div className="p-4">
                            <Button variant="outline" className="w-full justify-start gap-2 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800">
                                <LogIn size={16} />
                                <span>Login</span>
                            </Button>
                            <Button
                                className="mt-4 w-full justify-start gap-2 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                                onClick={handleNewChat}
                            >
                                <Plus size={16} />
                                <span>New Chat</span>
                            </Button>
                        </div>
                        <Separator className="dark:bg-gray-800" />
                        <div className="custom-scrollbar flex-1 overflow-auto p-2">
                            <h2 className="px-2 py-1 text-xs font-semibold dark:text-gray-400">Recent Chats</h2>
                            {chatSessions.map((chat) => {
                                const isActive = chat.id === sessionId;
                                return (
                                    <Button
                                        key={chat.id}
                                        variant="ghost"
                                        onClick={() => loadConversation(chat.id)}
                                        className={`mb-1 w-full justify-start px-2 py-2 text-left ${
                                            isActive
                                                ? 'bg-gray-800 dark:bg-gray-800 dark:text-gray-100'
                                                : 'dark:text-gray-200 dark:hover:bg-gray-800'
                                        }`}
                                    >
                                        <MessageSquare size={16} className="mr-2 flex-shrink-0" />
                                        <span className="truncate">{chat.title}</span>
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                    {isSidebarOpen && (
                        <div
                            className="bg-opacity-50 fixed inset-0 z-10 bg-black md:hidden"
                            onClick={() => setIsSidebarOpen(false)}
                        />
                    )}
                    <div className="flex w-full flex-1 flex-col dark:bg-gray-900">
                        <div className="flex h-12 items-center border-b px-4 dark:border-gray-800">
                            <Button variant="ghost" size="icon" className="mr-2" onClick={toggleSidebar}>
                                <Menu size={20} />
                            </Button>
                        </div>
                        <div className="custom-scrollbar flex-1 overflow-auto p-4">
                            {messages.map((message, index) => (
                                <div key={index} className={`mb-4 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={`max-w-3xl rounded-lg p-3 ${
                                            message.role === 'user'
                                                ? 'dark:bg-gray-700 dark:text-gray-100'
                                                : 'dark:bg-gray-800 dark:text-gray-100'
                                        }`}
                                    >
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {message.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            ))}
                            {isResponding && (
                                <div className="mb-4 flex justify-start">
                                    <div className="max-w-3xl rounded-lg p-3 dark:bg-gray-800 dark:text-gray-100">
                                        <span className="text-sm text-gray-400 italic">AI is responding...</span>
                                    </div>
                                </div>
                            )}
                        </div>
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
                                    disabled={isResponding}
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
