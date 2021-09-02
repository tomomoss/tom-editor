// 以下、カスタムイベントに関係する型エイリアスです。
type TOMEditorBlurEvent = {};
type TOMEditorChangeFocusedRowIndexEvent = {
  focusedRowIndex: number | null
};
type TOMEditorChangeNumberOfTextLinesEvent = {
  numberOfTextLines: number
};
type TOMEditorChangeSelectiingRange = {
  selectingRange: boolean
};
type TOMEditorChangeTextAreaScrollLeft = {
  scrollLeft: number
};
type TOMEditorChangeTextAreaScrollTop = {
  scrollTop: number
};
type TOMEditorChangeTextAreaViewportHeightRatio = {
  viewportHeightRatio: number
};
type TOMEditorChangeTextAreaViewportWidthRatio = {
  viewportWidthRatio: number
};
type TOMEditorCompositionEndEvent = {};
type TOMEditorCompositionStartEvent = {};
type TOMEditorDragHorizontalScrollbarEvent = {
  distance: number
};
type TOMEditorDragLineNumberEvent = {
  draggedIndex: number
};
type TOMEditorDragVerticalScrollbarEvent = {
  distance: number
};
type TOMEditorFirstInitializeEvent = {
  editor: HTMLDivElement,
  horizontalScrollbarArea: HTMLDivElement
};
type TOMEditorHorizontalScrollEvent = {
  scrollSize: number
};
type TOMEditorInputEvent = {
  data: string,
  selectionStart: number
};
type TOMEditorKeyDownEvent = {
  ctrlKey: boolean,
  key: string,
  shiftKey: boolean
};
type TOMEditorMouseDownHorizontalScrollbarAreaEvent = TOMEditorMouseDownScrollbarAreaEvent;
type TOMEditorMouseDownLineNumber = {
  lineNumberIndex: number
};
type TOMEditorMouseDownScrollbarAreaEvent = {
  scrollDirection: 1 | -1
};
type TOMEditorMouseDownVerticalScrollbarAreaEvent = TOMEditorMouseDownScrollbarAreaEvent;
type TOMEditorMouseMoveEvent = {
  left: number,
  target: HTMLElement,
  top: number
};
type TOMEditorMoveFocusPointPositionEvent = {
  left: number | null,
  top: number | null
};
type TOMEditorResizeTextAreaHeight = {
  height: number
};
type TOMEditorResizeTextAreaWidth = {
  width: number
};
type TOMEditorSecondInitializeEvent = {
  lineNumberAreaWidth: number
};
type TOMEditorVerticalScrollEvent = {
  scrollSize: number
};
