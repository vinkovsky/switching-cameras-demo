import { ReactNode, useRef } from "react";
import { StoreApi } from "zustand";
import { EditorStore, createEditorStore } from "./editor-store";
import { EditorStoreContext } from "./editor-store-context";

export interface EditorStoreProviderProps {
  children: ReactNode;
}

export const EditorStoreProvider = ({
  children,
}: EditorStoreProviderProps): JSX.Element => {
  const storeRef = useRef<StoreApi<EditorStore>>();

  if (!storeRef.current) {
    storeRef.current = createEditorStore();
  }

  return (
    <EditorStoreContext.Provider value={storeRef.current}>
      {children}
    </EditorStoreContext.Provider>
  );
};
