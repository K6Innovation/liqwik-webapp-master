import React from "react";

type Props = {};

export default function Loading({}: Props) {
  return (
    <div className="flex p-4 items-center justify-center">
      <span className="loading loading-spinner loading-md"></span>
    </div>
  );
}
