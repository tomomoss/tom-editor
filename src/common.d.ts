// 以下、特定の括りに属さない型エイリアスです。
type CompositionState = {
  isComposing: boolean,
  lastData: string | null,
  startColumnIndex: number | null,
  startSelectionStart: number | null
};
type FocusPointIndex = {
  column: number | null,
  row: number | null
};
type LastDispatchedEventValue =
  TOMEditorChangeFocusedRowIndexEvent &
  TOMEditorChangeNumberOfTextLinesEvent &
  TOMEditorChangeSelectiingRange &
  TOMEditorResizeTextAreaHeight &
  TOMEditorChangeTextAreaScrollLeft &
  TOMEditorChangeTextAreaScrollTop &
  TOMEditorChangeTextAreaViewportHeightRatio &
  TOMEditorChangeTextAreaViewportWidthRatio &
  TOMEditorResizeTextAreaWidth
type Main = EventTarget;
type TextAreaContent = {
  characterList: HTMLSpanElement[],
  textLine: HTMLDivElement
};
type TextAreaHistory = {
  focusPointIndex: FocusPointIndex,
  scrollLeft: number,
  scrollTop: number,
  textAreaContentList: TextAreaContent[]
};
type TextAreaHistoryList = {
  data: TextAreaHistory[]
  index: number
};
type TOMEditorOption = {
  readonly?: boolean
};
type ValueObserver = (value: string) => void;
type VerticalScrollbarArea = {};
