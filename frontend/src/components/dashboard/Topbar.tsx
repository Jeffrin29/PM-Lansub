import { FaSearch, FaBell, FaUserCircle } from "react-icons/fa";
import ThemeToggle from "./ThemeToggle";
import ClockButton from "./ClockButton";

export default function Topbar() {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-black p-6">

      {/* Search */}

      <div className="flex items-center bg-zinc-900 dark:bg-zinc-900 light:bg-gray-200 border border-zinc-800 rounded-lg px-4 py-2 w-80">

        <FaSearch className="text-gray-400 mr-2" />

        <input
          placeholder="Search..."
          className="bg-transparent outline-none text-sm w-full"
        />

      </div>

      {/* Right Icons */}

      <div className="flex items-center gap-6">

        <ThemeToggle />

        <FaBell className="cursor-pointer" />

        <FaUserCircle className="text-xl cursor-pointer" />

        <ClockButton />

      </div>

    </div>
  );
}