import { useContext } from "react";
import { createStore, useStore } from "zustand";
import { EditorStoreContext } from "./editor-store-context";

export type EditorState = {
  count: number;
};

export type EditorActions = {
  decrementCount: () => void;
  incrementCount: () => void;
};

export type EditorStore = EditorState & EditorActions;

export const defaultInitState: EditorState = {
  count: 0,
};

export const createEditorStore = (
  initState: EditorState = defaultInitState
) => {
  return createStore<EditorStore>()((set) => ({
    ...initState,
    decrementCount: () => set((state) => ({ count: state.count - 5 })),
    incrementCount: () => set((state) => ({ count: state.count + 5 })),
  }));
};

export const useEditorStore = <T>(selector: (store: EditorStore) => T): T => {
  const editorStoreContext = useContext(EditorStoreContext);

  if (!editorStoreContext) {
    throw new Error(`useEditorStore must be use within EditorStoreProvider`);
  }

  return useStore(editorStoreContext, selector);
};
