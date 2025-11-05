import { useEffect, useRef, useState } from "react";

export default function useChatSocket(
  username,
  onMessage,
  setTypingUser,
  setRequests,       // 👈 for instant friend-request updates
  onFriendAccepted   // 👈 callback to refresh friend list
) {
  const socketRef = useRef(null);
  const [socketReady, setSocketReady] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]); // 🟢 Track online users
  const [receivedMessageIds, setReceivedMessageIds] = useState(new Set()); // prevent duplicates

  useEffect(() => {
    if (!username) return;

    const token = localStorage.getItem("token");
    const wsUrl = `ws://localhost:5000?token=${token}`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("✅ WebSocket connected");
      setSocketReady(true);
    };

    // ✅ Handle all incoming messages
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // 🧠 Skip duplicates
        if (data.id && receivedMessageIds.has(data.id)) return;
        if (data.id) {
          setReceivedMessageIds((prev) => new Set(prev).add(data.id));
        }

        switch (data.type) {
          // 🧠 Load chat history
          case "history":
            if (Array.isArray(data.messages)) {
              data.messages.forEach((m) =>
                onMessage({
                  from: m.sender_name,
                  text: m.content,
                  to: m.receiver_id,
                  time: new Date(m.created_at).toISOString(),
                  type: m.receiver_id ? "private" : "chat",
                  isHistory: true,
                  delivered: m.delivered,
                  seen: m.seen,
                })
              );
            }
            break;

          // 💬 Private message
          case "private":
            onMessage({
              from: data.from,
              text: data.text,
              to: data.to,
              time: data.time || new Date().toISOString(),
              type: "private",
              isHistory: data.isHistory ?? false,
              delivered: data.delivered ?? false,
              seen: data.seen ?? false,
            });

            // ✅ Send "delivered" confirmation back to server
            if (data.id) {
              ws.send(
                JSON.stringify({
                  type: "delivered",
                  messageId: data.id,
                })
              );
            }

            // 🔔 Browser notification (if tab not focused)
            if (
              data.from &&
              data.from !== username &&
              document.visibilityState === "hidden" &&
              (data.isHistory === false || data.isHistory === undefined)
            ) {
              if (Notification.permission === "granted") {
                new Notification(`💬 New message from ${data.from}`, {
                  body: data.text,
                  icon: "/chat-icon.png",
                });
              }
            }
            break;

          // 🌍 Group chat
          case "chat":
            onMessage({
              from: data.from,
              text: data.text,
              time: data.time || new Date().toISOString(),
              type: "chat",
              isHistory: false,
            });
            break;

          // ✍️ Typing indicator
          case "typing":
            if (data.user && data.user !== username) {
              setTypingUser(data.user);
              setTimeout(() => setTypingUser(""), 1500);
            }
            break;

          // 🟢 Online/offline users
          case "status":
            if (data.users) setOnlineUsers(data.users);
            break;

          // 👀 Seen notification
          case "seen":
            console.log(`👀 Messages seen by ${data.from}`);
            // Optional: visually update local message list here
            break;

          // 👥 Friend request
          case "friend_request":
            console.log("📩 New friend request received:", data);
            if (setRequests) {
              setRequests((prev) => {
                const existing = Array.isArray(prev) ? prev : [];
                if (existing.some((r) => r.username === data.from)) return existing;
                return [...existing, { username: data.from, message: data.message }];
              });
            }
            if (Notification.permission === "granted") {
              new Notification("🔔 Friend Request", {
                body: `${data.from} sent you a friend request!`,
              });
            }
            break;

          // ✅ Friend accepted
          case "friend_accepted":
            console.log("✅ Friend accepted:", data.from);
            if (onFriendAccepted) {
              onFriendAccepted(data.from);
              setTimeout(() => onFriendAccepted(data.from), 800);
            }
            if (Notification.permission === "granted") {
              new Notification("👥 New Friend Added", {
                body: `${data.from} accepted your request!`,
              });
            }
            break;

          // 🚫 Friend removed
          case "friend_removed":
            console.log("❌ Friend removed:", data.from);
            if (setRequests) {
              setRequests((prev) =>
                Array.isArray(prev)
                  ? prev.filter((r) => r.username !== data.from)
                  : prev
              );
            }
            if (Notification.permission === "granted") {
              new Notification("🚫 Friend Removed", {
                body: `${data.message}`,
              });
            }
            break;

          default:
            console.warn("⚠️ Unknown WebSocket type:", data);
        }
      } catch (err) {
        console.error("❌ WS message error:", err);
      }
    };

    ws.onclose = () => {
      console.log("❌ WebSocket disconnected, retrying in 3s...");
      setSocketReady(false);
      setTimeout(() => {
        const retry = new WebSocket(wsUrl);
        socketRef.current = retry;
      }, 3000);
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      setSocketReady(false);
    };

    return () => {
      ws.close();
      setSocketReady(false);
    };
  }, [username]);

  // ✅ Safe message sender
  const safeSend = (payload) => {
    const ws = socketRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    } else {
      console.warn("⚠️ WebSocket not ready, queued:", payload);
    }
  };

  // ✅ Seen notification trigger (call when chat opened)
  const sendSeen = (receiverId, senderId) => {
    const ws = socketRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "seen",
          fromId: senderId,
          toId: receiverId,
        })
      );
    }
  };

  // ✅ Ask for browser notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  return {
    socket: socketReady ? socketRef.current : null,
    safeSend,
    sendSeen, // 👈 added for external trigger
    onlineUsers,
  };
}
