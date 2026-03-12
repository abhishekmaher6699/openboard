import React from "react";

type Props = {
  tool: "rectangle" | "circle" | "sticky";
  setTool: React.Dispatch<
    React.SetStateAction<"rectangle" | "circle" | "sticky">
  >;
};

const BoardControls = ({tool, setTool}: Props) => {
  return (
    <div className="absolute flex gap-3 bottom-5 left-80 items-center justify-between">
      <button
        onClick={() => setTool("rectangle")}
        className={`font-bold py-2 px-4 border rounded
      ${
        tool === "rectangle"
          ? "bg-blue-500 text-white border-blue-500"
          : "bg-white hover:bg-gray-200 text-gray-800 border-gray-300"
      }
    `}
      >
        Rectangle
      </button>

      <button
        onClick={() => setTool("circle")}
        className={`font-bold py-2 px-4 border rounded
      ${
        tool === "circle"
          ? "bg-blue-500 text-white border-blue-500"
          : "bg-white hover:bg-gray-200 text-gray-800 border-gray-300"
      }
    `}
      >
        Circle
      </button>

      <button
        onClick={() => setTool("sticky")}
        className={`font-bold py-2 px-4 border rounded
      ${
        tool === "sticky"
          ? "bg-blue-500 text-white border-blue-500"
          : "bg-white hover:bg-gray-200 text-gray-800 border-gray-300"
      }
    `}
      >
        Sticky
      </button>
    </div>
  );
};

export default BoardControls;
