"use client";

import { EditorStoreProvider } from "./editor-store-provider";
import Viewport from "./viewport";

const Editor = (): JSX.Element => {
  return (
    <EditorStoreProvider>
      <Viewport />
    </EditorStoreProvider>
  );
};

export default Editor;
