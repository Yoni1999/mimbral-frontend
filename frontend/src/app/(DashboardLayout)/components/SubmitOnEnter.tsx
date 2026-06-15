"use client";

import React from "react";

type Props = {
  onSubmit: () => void;
  children: React.ReactNode;
};

const SubmitOnEnter: React.FC<Props> = ({ onSubmit, children }) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter") return;

    const target = event.target as HTMLElement | null;
    const tagName = target?.tagName?.toLowerCase();

    if (tagName === "textarea") return;
    if (target?.getAttribute("role") === "button") return;

    event.preventDefault();
    onSubmit();
  };

  return <div onKeyDown={handleKeyDown}>{children}</div>;
};

export default SubmitOnEnter;
