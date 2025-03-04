import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Menu, MessageSquare, Plus, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { v4 as uuidv4 } from 'uuid';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatSession {
    id: string;
    title: string;
    messages: ChatMessage[];
}

export default function ChatInterface() {
    // State for local chat sessions (stored in localStorage)
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    // ID of the currently active session
    const [activeSessionId, setActiveSessionId] = useState<string>('');
    const [input, setInput] = useState('');
    const [isResponding, setIsResponding] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    // Load sessions from localStorage on mount.
    useEffect(() => {
        const stored = localStorage.getItem('localChatSessions');
        if (stored) {
            const sessions: ChatSession[] = JSON.parse(stored);
            setChatSessions(sessions);
            // Use stored active session if available; else default to first session.
            const storedActive = localStorage.getItem('activeSessionId');
            if (storedActive && sessions.some((s) => s.id === storedActive)) {
                setActiveSessionId(storedActive);
            } else if (sessions.length > 0) {
                setActiveSessionId(sessions[0].id);
                localStorage.setItem('activeSessionId', sessions[0].id);
            }
        } else {
            // No sessions found, create default chat session.
            const defaultSession: ChatSession = {
                id: uuidv4(),
                title: 'Welcome to EasyChat',
                messages: [
                    {
                        role: 'user',
                        content: 'What is EasyChat?',
                    },
                    {
                        role: 'assistant',
                        content:
                            '**Welcome to EasyChat!**\n\nEasyChat is a simple, intuitive chat application that uses AI to help answer your questions. It supports Markdown formatting, so you can enjoy rich text responses. Start chatting and explore its features!',
                    },
                ],
            };
            setChatSessions([defaultSession]);
            setActiveSessionId(defaultSession.id);
            localStorage.setItem('localChatSessions', JSON.stringify([defaultSession]));
            localStorage.setItem('activeSessionId', defaultSession.id);
        }
    }, []);

    // Helper to save sessions to localStorage
    const saveSessions = (sessions: ChatSession[]) => {
        setChatSessions(sessions);
        localStorage.setItem('localChatSessions', JSON.stringify(sessions));
    };

    // Get the currently active session object.
    const activeSession = chatSessions.find((s) => s.id === activeSessionId);

    // Create a new chat session (empty) and set it as active.
    const handleNewChat = () => {
        const newSession: ChatSession = {
            id: uuidv4(),
            title: 'New Chat',
            messages: [],
        };
        const updatedSessions = [newSession, ...chatSessions];
        saveSessions(updatedSessions);
        setActiveSessionId(newSession.id);
        localStorage.setItem('activeSessionId', newSession.id);
    };

    // Send a message in the active session.
    const handleSendMessage = async () => {
        if (!input.trim() || !activeSession) return;

        // Add the user message.
        const userMessage: ChatMessage = { role: 'user', content: input };
        const updatedActiveSession = {
            ...activeSession,
            messages: [...activeSession.messages, userMessage],
        };
        // Update sessions list.
        const updatedSessions = chatSessions.map((session) => (session.id === activeSession.id ? updatedActiveSession : session));
        saveSessions(updatedSessions);
        setInput('');
        setIsResponding(true);

        // Build conversation prompt from the active session.
        const conversation = updatedActiveSession.messages
        .filter(m => m.role !== 'user' || m.content.trim() !== "What is EasyChat?")
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');

        try {
            const response = await fetch('/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                body: JSON.stringify({ text: conversation }),
            });
            const data = await response.json();
            // Extract assistant response from Gemini's response.
            const assistantText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response from Gemini';
            const assistantMessage: ChatMessage = { role: 'assistant', content: assistantText };

            // Append assistant message.
            const finalActiveSession = {
                ...updatedActiveSession,
                messages: [...updatedActiveSession.messages, assistantMessage],
            };
            const finalSessions = chatSessions.map((session) => (session.id === activeSession.id ? finalActiveSession : session));
            saveSessions(finalSessions);
        } catch (error) {
            console.error('Error calling Gemini:', error);
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
                            {chatSessions.map((session) => {
                                const isActive = session.id === activeSessionId;
                                return (
                                    <Button
                                        key={session.id}
                                        variant="ghost"
                                        onClick={() => {
                                            setActiveSessionId(session.id);
                                            localStorage.setItem('activeSessionId', session.id);
                                        }}
                                        className={`mb-1 w-full justify-start px-2 py-2 text-left ${
                                            isActive ? 'bg-gray-800 dark:bg-gray-800 dark:text-gray-100' : 'dark:text-gray-200 dark:hover:bg-gray-800'
                                        }`}
                                    >
                                        <MessageSquare size={16} className="mr-2 flex-shrink-0" />
                                        <span className="truncate">{session.title}</span>
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                    {isSidebarOpen && <div className="bg-opacity-50 fixed inset-0 z-10 bg-black md:hidden" onClick={() => setIsSidebarOpen(false)} />}
                    {/* Chat area */}
                    <div className="flex w-full flex-1 flex-col dark:bg-gray-900">
                        {/* Header with menu button */}
                        <div className="flex h-12 items-center border-b px-4 dark:border-gray-800">
                            <Button variant="ghost" size="icon" className="mr-2" onClick={toggleSidebar}>
                                <Menu size={20} />
                            </Button>
                        </div>
                        {/* Chat messages */}
                        <div className="custom-scrollbar flex-1 overflow-auto p-4">
                            {activeSession &&
                                activeSession.messages.map((message, index) => (
                                    <div key={index} className={`mb-4 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div
                                            className={`max-w-3xl rounded-lg p-3 whitespace-pre-wrap ${
                                                message.role === 'user'
                                                    ? 'dark:bg-gray-700 dark:text-gray-100'
                                                    : 'dark:bg-gray-800 dark:text-gray-100'
                                            }`}
                                        >
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
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
