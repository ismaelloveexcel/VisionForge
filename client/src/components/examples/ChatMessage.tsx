import { ChatMessage } from "../ChatMessage";

export default function ChatMessageExample() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <ChatMessage
        role="user"
        content="I want to build a task management app with Discord notifications"
        timestamp="2:34 PM"
      />
      <ChatMessage
        role="assistant"
        content="I'd be happy to help you build that! Let me analyze your requirements and suggest a tech stack. For a task management app with Discord integration, I recommend using React for the frontend and Express for the backend API."
        timestamp="2:34 PM"
      />
      <ChatMessage role="assistant" content="" isTyping />
    </div>
  );
}
