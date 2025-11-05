export default function MessageBubble({ message, username }) {
  const isMine = message.from === username;
  const isSystem = message.from === "System";

  return (
    <div
      className={`flex ${
        isMine ? "justify-end" : "justify-start"
      } transition-all`}
    >
      <div
        className={`max-w-md px-3 py-2 rounded-2xl shadow-sm ${
          isSystem
            ? "bg-gray-200 text-gray-600 text-center w-full"
            : isMine
            ? "bg-blue-500 text-white"
            : "bg-white text-gray-800 border"
        }`}
      >
        {!isSystem && <span className="block font-semibold">{message.from}</span>}
        <span>{message.text}</span>
      </div>
    </div>
  );
}
