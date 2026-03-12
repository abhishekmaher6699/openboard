import { useEffect } from "react";

export function useResize({
  viewportRef,
  resizeRef,
  selectionRef,
  graphMapRef,
  onResize,
}: any) {
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const move = (e: any) => {
      const resize = resizeRef.current;
      if (!resize) return;

      const viewport = viewportRef.current;
      const pos = viewport.toWorld(e.global);

      const dx = pos.x - resize.startX;
      const dy = pos.y - resize.startY;

      let width = resize.startWidth;
      let height = resize.startHeight;
      let x = resize.startObjX;
      let y = resize.startObjY;

      switch (resize.direction) {
        case "right":
          width = resize.startWidth + dx;
          break;

        case "bottom":
          height = resize.startHeight + dy;
          break;

        case "left":
          width = resize.startWidth - dx;
          x = resize.startObjX + dx;
          break;

        case "top":
          height = resize.startHeight - dy;
          y = resize.startObjY + dy;
          break;
      }

      width = Math.max(40, width);
      height = Math.max(40, height);

      resize.preview = { width, height, x, y };

      // update selection preview only
      if (selectionRef.current) {
        selectionRef.current.x = x;
        selectionRef.current.y = y;
      }
    };

    const up = () => {
      const resize = resizeRef.current;
      if (!resize || !resize.preview) return;

      const r = resize.preview;

      onResize(resize.id, r.width, r.height);

      resizeRef.current = null;
    };

    viewport.on("pointermove", move);
    viewport.on("pointerup", up);
    viewport.on("pointerupoutside", up);

    return () => {
      viewport.off("pointermove", move);
      viewport.off("pointerup", up);
      viewport.off("pointerupoutside", up);
    };
  }, [onResize]);
}
