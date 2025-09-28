"use client";

import { memo } from "react";

function PureChatHeader() {
  return (
    <header className="flex items-center gap-2 bg-background px-2 py-1.5 md:px-2">
      {/* Header content removed for cleaner interface */}
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, () => {
  return true;
});
