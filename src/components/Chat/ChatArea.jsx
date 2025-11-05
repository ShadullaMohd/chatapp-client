import React, { useEffect, useState } from "react";
import axios from "axios";

export default function ChatArea({
  messages,
  typingUser,
  username,
  privateTo,
  sendMessage,
  handleTyping,
  text,
  setText,
  bottomRef,
}) {
  const [lastSeen, setLastSeen] = useState(null);

  useEffect(() => {
    const fetchLastSeen = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `http://localhost:5000/api/users/lastSeen/${privateTo}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setLastSeen(res.data.last_seen);
      } catch (err) {
        console.error("❌ Error fetching last seen:", err);
      }
    };

    if (privateTo) fetchLastSeen();
  }, [privateTo]);

  return (
    <div className="flex flex-col h-full">
      {/* HEADER */}
      <div className="flex flex-col bg-[#1e1e2f] p-3 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">{privateTo}</h2>
        <p className="text-xs text-gray-400">
          Last seen: {lastSeen ? new Date(lastSeen).toLocaleString() : "Online"}
        </p>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, i) => (
          <div key={i} className={`my-2 ${msg.from === username ? "text-right" : "text-left"}`}>
            <p
              className={`inline-block px-3 py-2 rounded-lg ${
                msg.from === username
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-100"
              }`}
            >
              {msg.text}
            </p>
          </div>
        ))}
        <div ref={bottomRef}></div>
      </div>

      {/* Typing indicator */}
      {typingUser && (
        <p className="text-xs text-gray-400 italic px-4 py-1">
          {typingUser} is typing...
        </p>
      )}

      {/* Input */}
      <div className="p-3 bg-[#1e1e2f] border-t border-gray-700 flex">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleTyping}
          placeholder="Type your message..."
          className="flex-1 bg-gray-800 text-white p-2 rounded-lg outline-none"
        />
        <button
          onClick={sendMessage}
          className="ml-2 bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}
