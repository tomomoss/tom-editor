// 以下、エディターを構成する主要な要素で用いられるCSSクラスをまとめたオブジェクトの構造を表す型エイリアスです。
type CaretStyleClass = StyleClass & {
  caret: {
    element: string;
    modifier: {
      animation: string;
      focus: string;
    };
  };
};
type EditorStyleClass = StyleClass & {
  editor: {
    element: string;
  };
  editorWrapper: {
    element: string;
  };
};
type HorizontalScrollbarAreaStyleClass = StyleClass & {
  horizontalScrollbar: {
    element: string;
    modifier: {
      valid: string;
    };
  };
  horizontalScrollbarArea: {
    element: string;
  };
};
type LineNumberAreaStyleClass = StyleClass & {
  lineNumber: {
    element: string;
    modifier: {
      focus: string;
      readOnly: string;
    };
  };
  lineNumberArea: {
    element: string;
    modifier: {
      readOnly: string;
    };
  };
};
type StyleClass = {
  [key: string]: {
    element: string;
    modifier?: {
      [key: string]: string;
    };
  };
};
type TextAreaStyleClass = StyleClass & {
  character: {
    element: string;
    modifier: {
      eol: string;
      select: string;
    };
  };
  textArea: {
    element: string;
  };
  textLine: {
    element: string;
  };
  textLinesWrapper: {
    element: string;
  };
};
type UnderlineStyleClass = StyleClass & {
  underline: {
    element: string;
    modifier: {
      valid: string;
    };
  };
};
type VerticalScrollbarAreaStyleClass = StyleClass & {
  verticalScrollbar: {
    element: string;
    modifier: {
      valid: string;
    };
  };
  verticalScrollbarArea: {
    element: string;
  };
};
