import { useEffect, useState, useRef } from "react";
import axios from "axios";
import HeaderBar from "../components/Chat/HeaderBar";
import ChatArea from "../components/Chat/ChatArea";
import AddFriendModal from "../components/Chat/AddFriendModal";
import FriendList from "../components/Chat/FriendsList";
import useChatSocket from "../components/Chat/useChatSocket";
import toast, { Toaster } from "react-hot-toast"; // ✅ added

const API_URL = import.meta.env.VITE_API_URL; // ✅ base backend URL

export default function ChatRoom() {
  const [messages, setMessages] = useState([]);
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendEmail, setFriendEmail] = useState("");
  const [privateTo, setPrivateTo] = useState("");
  const [privateUserId, setPrivateUserId] = useState(null);
  const [typingUser, setTypingUser] = useState("");
  const [text, setText] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({});
  const [lastReadMap, setLastReadMap] = useState({});
  const [activeTab, setActiveTab] = useState("friends");

  const username = localStorage.getItem("username");
  const email = localStorage.getItem("email");
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  const bottomRef = useRef(null);
  const activeChatRef = useRef(privateTo);

  useEffect(() => {
    activeChatRef.current = privateTo;
  }, [privateTo]);

  /** ✅ When a friend request is accepted in real time */
  const handleFriendAccepted = (fromUsername) => {
    console.log("✅ Friend accepted in real time:", fromUsername);
    fetchFriends();
    setRequests((prev) =>
      Array.isArray(prev)
        ? prev.filter((r) => r.username !== fromUsername)
        : prev
    );
  };

  /** ✅ WebSocket setup with message + friend events */
  const { socket, safeSend, onlineUsers } = useChatSocket(
    username,
    (newMsg) => {
      if (newMsg.type === "chat") return;
      setMessages((prev) => [...prev, newMsg]);

      if (
        newMsg.type === "private" &&
        !newMsg.isHistory &&
        newMsg.from !== username &&
        activeChatRef.current !== newMsg.from
      ) {
        setUnreadCounts((prev) => ({
          ...prev,
          [newMsg.from]: (prev[newMsg.from] || 0) + 1,
        }));
      }
    },
    setTypingUser,
    setRequests,
    handleFriendAccepted
  );

  /** ✅ Auto scroll to bottom when messages change */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /** ✅ Save / restore last read map */
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("lastReadMap")) || {};
    setLastReadMap(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("lastReadMap", JSON.stringify(lastReadMap));
  }, [lastReadMap]);

  /** ✅ Fetch chat history between logged-in user and selected friend */
  const fetchChatHistory = async (selectedUser) => {
    try {
      setMessages([]);
      const resUser = await axios.get(`${API_URL}/api/auth/users`);
      const users = resUser.data;
      const receiver = users.find((u) => u.username === selectedUser);
      if (!receiver) return;

      setPrivateUserId(receiver.id);
      setPrivateTo(selectedUser);
      setUnreadCounts((prev) => ({ ...prev, [selectedUser]: 0 }));
      setLastReadMap((prev) => ({ ...prev, [selectedUser]: Date.now() }));

      const res = await axios.get(`${API_URL}/api/chat/history/${receiver.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data;
      if (!data.messages) return;

      const formatted = data.messages.map((m) => ({
        from: m.sender_name,
        to: m.receiver_name,
        text: m.content,
        time: new Date(m.created_at).toISOString(),
        type: "private",
        isHistory: true,
      }));

      setMessages(formatted);
      setActiveTab("chat");
    } catch (err) {
      console.error("❌ Error loading chat history:", err);
    }
  };

  /** ✅ Fetch friends list from backend */
  const fetchFriends = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/friends/list/${userId}`);
      const unique = Array.isArray(res.data)
        ? res.data.filter(
            (v, i, a) => a.findIndex((t) => t.id === v.id) === i
          )
        : [];
      setFriends(unique);
    } catch (err) {
      console.error("❌ Error fetching friends:", err);
    }
  };

  /** ✅ Fetch incoming friend requests */
  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/friends/requests/${userId}`);
      setRequests(res.data);
    } catch (err) {
      console.error("❌ Error fetching requests:", err);
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchFriends();
    fetchRequests();
  }, [userId]);

  /** ✅ Add friend by email */
  const handleAddFriend = async () => {
    if (!friendEmail.trim()) return toast.error("Enter valid email");
    try {
      await axios.post(`${API_URL}/api/friends/add`, {
        requesterEmail: email,
        receiverEmail: friendEmail.trim(),
      });
      toast.success("✅ Friend request sent!");
      setShowAddFriend(false);
      setFriendEmail("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send friend request");
    }
  };

  /** ✅ Accept / Reject / Unfriend logic */
  const handleAccept = async (id) => {
    try {
      await axios.post(`${API_URL}/api/friends/accept/${id}`);
      fetchFriends();
      fetchRequests();
      setMessages((prev) => [
        ...prev,
        {
          from: "System",
          text: "🎉 You are now friends! You can chat each other.",
        },
      ]);
    } catch {
      toast.error("Failed to accept request");
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.post(`${API_URL}/api/friends/reject/${id}`);
      fetchRequests();
      toast.success("🚫 Friend request rejected.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject request");
    }
  };

  const handleUnfriend = async (friendId) => {
    try {
      await axios.delete(`${API_URL}/api/friends/remove/${userId}/${friendId}`);
      fetchFriends();
      toast.success("🗑️ Unfriended successfully.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to unfriend");
    }
  };

  /** ✅ Send private message */
  const sendMessage = () => {
    if (!text.trim()) return;
    if (!privateTo) {
      toast.error("Please select a friend to start chatting privately.");
      return;
    }

    const newMessage = {
      from: username,
      to: privateTo,
      text,
      time: new Date().toISOString(),
      type: "private",
      isHistory: false,
    };
    setMessages((prev) => [...prev, newMessage]);

    safeSend({ type: "private", to: privateTo, text });

    setText("");
  };

  /** ✍️ Typing indicator logic */
  const handleTyping = () => {
    if (socket && socket.readyState === WebSocket.OPEN && privateTo) {
      socket.send(
        JSON.stringify({
          type: "typing",
          user: username,
          to: privateTo,
        })
      );
    }
  };

  /** 🚪 Logout */
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-[#1e1e2f] to-[#2d2d44] text-white">
    <Toaster position="top-center" />
      {/* HEADER */}
      <HeaderBar
        username={username}
        requests={requests}
        onLogout={handleLogout}
        onNotifications={fetchRequests}
        onAddFriend={() => setShowAddFriend(true)}
        onFriends={fetchFriends}
        onAcceptRequest={handleAccept}
        onRejectRequest={handleReject}
      />

      {/* MOBILE NAVIGATION */}
      <div className="md:hidden flex justify-around items-center bg-[#1e1e2f] border-b border-gray-700 py-2 z-40">
        <button
          className={`text-sm font-semibold ${
            activeTab === "friends" ? "text-blue-400" : "text-gray-300"
          }`}
          onClick={() => setActiveTab("friends")}
        >
          👥 Friends
        </button>
        <button
          className={`text-sm font-semibold ${
            activeTab === "requests" ? "text-blue-400" : "text-gray-300"
          }`}
          onClick={() => setActiveTab("requests")}
        >
          🔔 Requests
        </button>
        <button
          className={`text-sm font-semibold ${
            activeTab === "chat" ? "text-blue-400" : "text-gray-300"
          }`}
          onClick={() => setActiveTab("chat")}
        >
          💬 Chat
        </button>
        <button
          className="text-sm font-semibold text-blue-400"
          onClick={() => setShowAddFriend(true)}
        >
          ➕ Add
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden bg-[#0f172a] text-white">
        {/* FRIENDS SIDEBAR */}
        <div className="hidden md:flex flex-col w-72 bg-gradient-to-b from-[#1e1e2f] to-[#2b2b44]
                        border-r border-gray-700 shadow-2xl rounded-r-3xl p-5 m-3">
          <h2 className="text-lg font-semibold mb-3 flex items-center justify-between">
            Friends
            <button
              onClick={() => setShowAddFriend(true)}
              className="text-blue-400 text-sm hover:text-blue-300"
            >
              + Add
            </button>
          </h2>

          <FriendList
            friends={friends}
            privateTo={privateTo}
            unreadCounts={unreadCounts}
            onlineUsers={onlineUsers}
            fetchChatHistory={fetchChatHistory}
            handleUnfriend={handleUnfriend}
          />
        </div>

        {/* CHAT AREA */}
        <div className="flex-1 flex flex-col bg-[#141826] rounded-l-3xl shadow-xl m-3 overflow-hidden">
          {activeTab === "friends" && (
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4 text-blue-400">
                Friends List
              </h2>
              <FriendList
                friends={friends}
                privateTo={privateTo}
                unreadCounts={unreadCounts}
                onlineUsers={onlineUsers}
                fetchChatHistory={fetchChatHistory}
                handleUnfriend={handleUnfriend}
              />
            </div>
          )}

          {activeTab === "requests" && (
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4 text-blue-400">
                Friend Requests
              </h2>
              {requests.length === 0 ? (
                <p className="text-gray-400 text-sm">No pending requests.</p>
              ) : (
                requests.map((r) => (
                  <div
                    key={r.id}
                    className="flex justify-between items-center bg-[#22223a] rounded-lg px-3 py-2 mb-2"
                  >
                    <span className="text-sm">{r.username}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(r.id)}
                        className="bg-green-600 text-xs px-2 py-1 rounded hover:bg-green-700"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleReject(r.id)}
                        className="bg-red-600 text-xs px-2 py-1 rounded hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "chat" && !privateTo && (
            <div className="flex flex-col items-center justify-center flex-1 text-gray-400">
              <span className="text-4xl mb-3">💬</span>
              <p className="text-lg">Select a friend to start chatting privately.</p>
            </div>
          )}

          {activeTab === "chat" && privateTo && (
            <ChatArea
              messages={messages}
              typingUser={typingUser}
              username={username}
              privateTo={privateTo}
              sendMessage={sendMessage}
              handleTyping={handleTyping}
              text={text}
              setText={setText}
              bottomRef={bottomRef}
            />
          )}
        </div>
      </div>

      {/* ADD FRIEND MODAL */}
      {showAddFriend && (
        <AddFriendModal
          friendEmail={friendEmail}
          setFriendEmail={setFriendEmail}
          handleAddFriend={handleAddFriend}
          onClose={() => setShowAddFriend(false)}
        />
      )}
      
    </div>
  );
}
