import { ChatInput } from "../ChatInput";

export default function ChatInputExample() {
  return (
    <div className="p-4">
      <ChatInput onSend={(msg) => console.log("Sent:", msg)} />
    </div>
  );
}
