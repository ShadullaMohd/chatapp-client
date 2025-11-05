import { useState, useRef, useEffect } from "react";

export default function HeaderBar({
  username,
  requests,
  onLogout,
  onNotifications,
  onAcceptRequest,
  onRejectRequest, // 👈 new prop for reject action
}) {
  const [showRequests, setShowRequests] = useState(false);
  const dropdownRef = useRef(null);

  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowRequests(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <header className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-white shadow-md sticky top-0 z-20">
      <div
        className="flex justify-between items-center relative"
        ref={dropdownRef}
      >
        {/* 🟦 App Title */}
        <h2 className="font-bold text-2xl tracking-wide select-none">
          ChatConnect 💬
        </h2>

        {/* 🔔 Notification + Username + Logout */}
        <div className="flex items-center gap-5">
          {/* 🔔 Notifications — visible only on DESKTOP */}
          <div className="relative hidden lg:block">
            <button
              className="relative cursor-pointer hover:scale-110 transition"
              title="Friend Requests"
              onClick={async () => {
                await onNotifications();
                setShowRequests((prev) => !prev);
              }}
            >
              🔔
              {requests.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-xs rounded-full px-1">
                  {requests.length}
                </span>
              )}
            </button>

            {/* 📨 Friend Requests Dropdown */}
            {showRequests && (
              <div className="absolute right-0 mt-3 w-72 bg-[#1e1e2f] text-white rounded-lg shadow-lg border border-gray-600 z-30 animate-fade-in">
                <h4 className="text-center text-sm font-semibold py-2 border-b border-gray-700">
                  Friend Requests
                </h4>

                {requests.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
                    {requests.map((r) => (
                      <div
                        key={r.id}
                        className="flex justify-between items-center px-3 py-2 border-b border-gray-700 text-sm"
                      >
                        <span className="truncate max-w-[100px]" title={r.username}>
                          {r.username}
                        </span>

                        <div className="flex gap-2">
                          {/* ✅ Accept Button */}
                          <button
                            onClick={() => onAcceptRequest(r.id)}
                            className="bg-green-600 text-xs px-2 py-1 rounded hover:bg-green-700"
                          >
                            Accept
                          </button>

                          {/* ❌ Reject Button */}
                          <button
                            onClick={() => onRejectRequest(r.id)}
                            className="bg-red-600 text-xs px-2 py-1 rounded hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-400 text-sm">
                    No new requests.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 👤 Username */}
          <span className="font-semibold text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">
            Hi, {username}
          </span>

          {/* 🚪 Logout */}
          <button
            onClick={onLogout}
            className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded-md font-semibold text-sm transition"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
