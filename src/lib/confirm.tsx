"use client";

import { createRoot, type Root } from "react-dom/client";
import { ConfirmDialog } from "@/components/ui/modal";

let root: Root | null = null;

/** Show a confirmation dialog and resolve with the user's choice. */
export function confirmDelete(title: string, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);

    const cleanup = (result: boolean) => {
      root?.unmount();
      host.remove();
      root = null;
      resolve(result);
    };

    root.render(
      <ConfirmDialog
        open
        title={title}
        message={message}
        onClose={() => cleanup(false)}
        onConfirm={() => cleanup(true)}
      />
    );
  });
}
