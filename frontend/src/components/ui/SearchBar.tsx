import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-2 bg-white w-full max-w-md">
      <MagnifyingGlassIcon className="size-5 text-gray-400 shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search your brain..."
        className="outline-none w-full text-sm"
      />
    </div>
  );
}
