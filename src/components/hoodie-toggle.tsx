import { Shirt } from "lucide-react";
import { useEffect } from "react";

type HoodieType = "black" | "white";

interface HoodieToggleProps {
  hoodieType: HoodieType;
  onHoodieChange: (hoodie: HoodieType) => void;
}

export function HoodieToggle({ hoodieType, onHoodieChange }: HoodieToggleProps) {
  useEffect(() => {
    localStorage.setItem("hoodie", hoodieType);
  }, [hoodieType]);

  const toggleHoodie = () => {
    onHoodieChange(hoodieType === "black" ? "white" : "black");
  };

  return (
    <button
      onClick={toggleHoodie}
      className="bg-transparent hover:opacity-80 border-0 p-0 h-full w-full flex items-center justify-center relative cursor-pointer"
      aria-label="Toggle hoodie"
    >
      <div className="relative w-4 h-4 md:w-5 md:h-5 flex items-center justify-center">
        <Shirt className="w-4 h-4 md:w-5 md:h-5 text-background" />
      </div>
      <span className="sr-only">Toggle hoodie</span>
    </button>
  );
}

