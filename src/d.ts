interface CaretStyleClass extends StyleClass {
  caret: {
    element: string,
    modifier: {
      animation: string,
      focus: string
    }
  }
}
interface EditorStyleClass extends StyleClass {
  editor: {
    element: string
  },
  editorWrapper: {
    element: string
  }
}
interface HorizontalScrollbarAreaStyleClass extends StyleClass {
  horizontalScrollbar: {
    element: string,
    modifier: {
      valid: string
    }
  }, 
  horizontalScrollbarArea: {
    element: string
  }
}
interface LineNumberAreaStyleClass extends StyleClass {
  lineNumber: {
    element: string,
    modifier: {
      focus: string,
      readOnly: string
    }
  },
  lineNumberArea: {
    element: string,
    modifier: {
      readOnly: string
    }
  }
}
interface Main extends EventTarget { }
interface MainInitializeEvent {
  editor: HTMLDivElement
}
interface StyleClass {
  [key: string]: {
    element: string,
    modifier?: {
      [key: string]: string
    }
  }
}
interface TextAreaContents {
  characterList: HTMLSpanElement[],
  textLine: HTMLDivElement
}
interface TextAreaStyleClass extends StyleClass {
  character: {
    element: string,
    modifier: {
      eol: string
    }
  },
  textArea: {
    element: string
  },
  textLine: {
    element: string
  },
  textLinesWrapper: {
    element: string
  }
}
interface TOMEditorOption {
  readonly: boolean
}
interface UnderlineStyleClass extends StyleClass {
  underline: {
    element: string,
    modifier: {
      valid: string
    }
  }
}
interface VerticalScrollbarAreaStyleClass extends StyleClass {
  verticalScrollbar: {
    element: string,
    modifier: {
      valid: string
    }
  }, 
  verticalScrollbarArea: {
    element: string
  }
}
