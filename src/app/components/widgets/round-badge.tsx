import React, { useEffect, useState } from "react";

type Props = {
  size: "lg" | "md" | "sm" | "xs";
  color: string;
  children: React.ReactNode;
};

export default function RoundBadge({ size, color, children }: Props) {
  const [dimension, setDimension] = useState<24 | 10 | 8 | 6>(
    size === "lg" ? 24 : size === "sm" ? 8 : size === "xs" ? 6 : 10
  );
  const [textSize, setTextSize] = useState<string>("");

  useEffect(() => {
    switch (size) {
      case "lg":
        setDimension(24);
        setTextSize("text-base");
        break;
      case "md":
        setDimension(10);
        setTextSize("text-base");
        break;
      case "sm":
        setDimension(8);
        setTextSize("text-sm");
        break;
      case "xs":
        setDimension(6);
        setTextSize("text-xs");
        break;
    }
  }, [size]);

  return (
    <div
      className={`
        flex items-center justify-center rounded-full text-white
        w-${dimension} 
        h-${dimension} 
        ${textSize}
        h-[${dimension}]
        ${color}
      `}
    >
      {children}
    </div>
  );
}
