import { createContext } from "react";
import { StoreApi } from "zustand";

import { EditorStore } from "./editor-store";

export const EditorStoreContext = createContext<StoreApi<EditorStore> | null>(
  null
);
