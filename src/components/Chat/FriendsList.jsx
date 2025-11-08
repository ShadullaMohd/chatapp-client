import React, { useEffect, useState } from "react";
import axios from "axios";

// ✅ Base backend URL from environment
const API_URL = import.meta.env.VITE_API_URL;

// 🕓 Helper to format “last seen” text
function timeAgo(timestamp) {
  if (!timestamp) return "unknown";
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? "s" : ""} ago`;
  return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
}

export default function FriendList({
  friends,
  privateTo,
  unreadCounts,
  onlineUsers,
  fetchChatHistory,
  handleUnfriend,
}) {
  const [lastSeenMap, setLastSeenMap] = useState({});

  // ✅ Fetch last seen info from backend
  useEffect(() => {
    async function loadLastSeen() {
      try {
        const results = await Promise.all(
          friends.map((f) =>
            axios
              .get(`${API_URL}/api/users/lastSeen/${f.username}`)
              .then((res) => ({ id: f.id, last_seen: res.data.last_seen }))
              .catch(() => ({ id: f.id, last_seen: null }))
          )
        );

        const map = {};
        results.forEach((r) => (map[r.id] = r.last_seen));
        setLastSeenMap(map);
      } catch (err) {
        console.error("❌ Failed to fetch last seen info:", err);
      }
    }

    if (friends.length > 0) loadLastSeen();
  }, [friends]);

  return (
    <div className="flex flex-col">
      {friends.length === 0 ? (
        <p className="text-gray-400 text-sm text-center mt-3">No friends yet.</p>
      ) : (
        friends.map((f) => {
          const isActive = privateTo === f.username;
          const unread = unreadCounts[f.username] || 0;
          const isOnline = onlineUsers?.includes(f.username);

          return (
            <div
              key={f.id}
              onClick={() => fetchChatHistory(f.username)}
              className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all mb-2 ${
                isActive
                  ? "bg-blue-600/70 text-white shadow-md"
                  : "bg-[#252547] hover:bg-[#333366]"
              }`}
            >
              {/* Left side — avatar + name */}
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-400 to-blue-400 flex items-center justify-center text-sm font-bold">
                  {f.username.charAt(0).toUpperCase()}
                </div>

                <div className="flex flex-col">
                  <span className="text-sm font-medium flex items-center gap-2">
                    {f.username}
                    {isOnline ? (
                      <span
                        className="h-2.5 w-2.5 bg-green-500 rounded-full animate-pulse"
                        title="Online"
                      ></span>
                    ) : (
                      <span
                        className="h-2.5 w-2.5 bg-gray-500 rounded-full"
                        title="Offline"
                      ></span>
                    )}
                  </span>

                  {/* 🕓 Last seen info */}
                  <span className="text-xs text-gray-400">
                    {isOnline
                      ? "Online"
                      : `Last seen ${timeAgo(lastSeenMap[f.id])}`}
                  </span>

                  {/* 🔔 Unread notifications */}
                  {unread > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-yellow-400 text-xs">🔔</span>
                      <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                        {unread}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right side — Unfriend Button */}
              {handleUnfriend && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnfriend(f.id);
                  }}
                  className="text-xs text-red-400 hover:text-red-500 ml-2"
                  title="Unfriend"
                >
                  🗑️
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
