export default function AddFriendModal({ friendEmail, setFriendEmail, handleAddFriend, onClose }) {
  return (
   
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-md bg-black/10 z-20">
      <div className="bg-[#1e1e2f] text-white rounded-2xl p-6 shadow-2xl w-80 sm:w-96 border border-gray-700">
        <h3 className="text-xl font-semibold mb-4 text-center text-blue-400">Add a Friend 👥</h3>
        <input
          type="email"
          placeholder="Enter friend’s email"
          className="w-full p-3 rounded-lg bg-[#252547] border border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none text-white"
          value={friendEmail}
          onChange={(e) => setFriendEmail(e.target.value)}
        />
        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleAddFriend}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
