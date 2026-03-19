import type { BoardDiff } from "../../../lib/diffUtils";
import { createObject, updateObject } from "../../../api/boardObjects";
import type { UseBoardToolbarProps } from "../../../types/canvas";

const STEP = 1000;
const RENORMALIZE_EPSILON = 1;



export function useBoardToolbar({
  boardId,
  selectedIds,
  objectsRef,
  setObjects,
  sendCreate,
  sendUpdate,
  sendUpdateMany,
  deleteObject,
  deleteManyObjects,
  clearSelectionRef,
  hideToolbar,
}: UseBoardToolbarProps) {
  const getSorted = () =>
    [...objectsRef.current].sort((a, b) => (a.z_index ?? 0) - (b.z_index ?? 0));

  const applyZUpdate = async (id: string, newZ: number, actionType: string) => {
    const obj = objectsRef.current.find((o) => o.id === id);
    const diff: BoardDiff = {
      type: "update",
      id,
      from: { z_index: obj?.z_index ?? 0 },
      to: { z_index: newZ },
    };
    setObjects((prev) =>
      prev.map((o) => (o.id === id ? { ...o, z_index: newZ } : o)),
    );
    sendUpdate(id, { z_index: newZ }, actionType, diff);
    await updateObject(boardId, id, { z_index: newZ });
  };

  const renormalize = async () => {
    const sorted = getSorted();
    const updates = sorted.map((o, i) => ({ ...o, z_index: i * STEP }));
    setObjects((prev) =>
      prev.map((o) => {
        const u = updates.find((u) => u.id === o.id);
        return u ? { ...o, z_index: u.z_index } : o;
      }),
    );
    // renormalize is internal bookkeeping — no diff needed, not undoable
    updates.forEach((u) =>
      sendUpdate(u.id, { z_index: u.z_index }, "update_object"),
    );
    await Promise.all(
      updates.map((u) => updateObject(boardId, u.id, { z_index: u.z_index })),
    );
    return updates;
  };

  const handleBringForward = async () => {
    for (const id of selectedIds) {
      let sorted = getSorted();
      let idx = sorted.findIndex((o) => o.id === id);
      if (idx === sorted.length - 1) return;

      let above: number = sorted[idx + 1].z_index ?? 0;
      let twoAbove: number = sorted[idx + 2]?.z_index ?? above + STEP * 2;
      let newZ: number = Math.floor((above + twoAbove) / 2);

      if (twoAbove - above < RENORMALIZE_EPSILON * 2) {
        const updates = await renormalize();
        sorted = [...updates].sort((a, b) => a.z_index - b.z_index);
        idx = sorted.findIndex((u) => u.id === id);
        if (idx === sorted.length - 1) return;
        above = sorted[idx + 1].z_index ?? 0;
        twoAbove = sorted[idx + 2]?.z_index ?? above + STEP * 2;
        newZ = Math.floor((above + twoAbove) / 2);
      }

      await applyZUpdate(id, newZ, "bring_forward");
    }
  };

  const handleSendBack = async () => {
    for (const id of selectedIds) {
      let sorted = getSorted();
      let idx = sorted.findIndex((o) => o.id === id);
      if (idx === 0) return;

      let below: number = sorted[idx - 1].z_index ?? 0;
      let twoBelow: number = sorted[idx - 2]?.z_index ?? below - STEP * 2;
      let newZ: number = Math.floor((below + twoBelow) / 2);

      if (below - twoBelow < RENORMALIZE_EPSILON * 2) {
        const updates = await renormalize();
        sorted = [...updates].sort((a, b) => a.z_index - b.z_index);
        idx = sorted.findIndex((u) => u.id === id);
        if (idx === 0) return;
        below = sorted[idx - 1].z_index ?? 0;
        twoBelow = sorted[idx - 2]?.z_index ?? below - STEP * 2;
        newZ = Math.floor((below + twoBelow) / 2);
      }

      await applyZUpdate(id, newZ, "send_back");
    }
  };

  const handleBringToFront = async () => {
    for (const id of selectedIds) {
      const sorted = getSorted();
      if (sorted[sorted.length - 1]?.id === id) return;
      const maxZ = sorted[sorted.length - 1]?.z_index ?? 0;
      await applyZUpdate(id, maxZ + STEP, "bring_to_front");
    }
  };

  const handleSendToBack = async () => {
    for (const id of selectedIds) {
      const sorted = getSorted();
      if (sorted[0]?.id === id) return;
      const minZ = sorted[0]?.z_index ?? 0;
      await applyZUpdate(id, minZ - STEP, "send_to_back");
    }
  };

  const handleDelete = () => {
    if (selectedIds.length === 1) deleteObject(selectedIds[0]);
    else if (selectedIds.length > 1) deleteManyObjects(selectedIds);
    clearSelectionRef.current?.();
    hideToolbar();
  };

  const handleDuplicate = async () => {
    for (const id of selectedIds) {
      const obj = objectsRef.current.find((o) => o.id === id);
      if (!obj) continue;
      try {
        const created = await createObject(boardId, {
          type: obj.type,
          x: obj.x + 20,
          y: obj.y + 20,
          width: obj.width,
          height: obj.height,
          z_index: (obj.z_index ?? 0) + 1000,
          data: { ...obj.data },
        });
        setObjects((prev) => [...prev, created]);
        sendCreate(created, { type: "create", object: created });
      } catch (err) {
        console.error("Duplicate failed", err);
      }
    }
  };


  const STYLE_DEFAULTS: Record<string, any> = {
    bold: false,
    italic: false,
    align: "center",
    fontSize: 16,
    fontFamily: "sans-serif",
    textColor: "#1a1a1a",
  };

  const updateTextStyle = async (
    ids: string[],
    style: Record<string, any>,
    actionType: string,
  ) => {
    const updates = ids.map((id) => {
      const obj = objectsRef.current.find((o) => o.id === id);
      const fromStyle: Record<string, any> = {};
      Object.keys(style).forEach((k) => {
        const prev = obj?.data?.[k];
        fromStyle[k] = prev !== undefined ? prev : (STYLE_DEFAULTS[k] ?? null);
      });
      return {
        id,
        from: { data: fromStyle },
        to: { data: style },
        changes: { data: style },
      };
    });

    const diff: BoardDiff = {
      type: "update_many",
      updates: updates.map((u) => ({ id: u.id, from: u.from, to: u.to })),
    };

    sendUpdateMany(
      updates.map((u) => ({ id: u.id, changes: u.changes })),
      actionType,
      diff,
    );

    setObjects((prev) =>
      prev.map((obj) =>
        ids.includes(obj.id)
          ? { ...obj, data: { ...obj.data, ...style } }
          : obj,
      ),
    );

    await Promise.all(
      ids.map((id) => {
        const existing =
          objectsRef.current.find((o) => o.id === id)?.data ?? {};
        console.log("saving data:", { ...existing, ...style });
        return updateObject(boardId, id, { data: { ...existing, ...style } });
      }),
    );
  };

  const handleBold = () => {
    const obj = objectsRef.current.find(
      (o) => selectedIds.includes(o.id) && o.type === "text",
    );
    updateTextStyle(selectedIds, { bold: !obj?.data?.bold }, "bold_text");
  };

  const handleItalic = () => {
    const obj = objectsRef.current.find(
      (o) => selectedIds.includes(o.id) && o.type === "text",
    );
    updateTextStyle(selectedIds, { italic: !obj?.data?.italic }, "italic_text");
  };

  const handleFontSize = (size: number) =>
    updateTextStyle(selectedIds, { fontSize: size }, "font_size");
  const handleAlign = (align: "left" | "center" | "right") =>
    updateTextStyle(selectedIds, { align }, "align_text");
  const handleFontFamily = (fontFamily: string) =>
    updateTextStyle(selectedIds, { fontFamily }, "font_family");
  const handleTextColor = (color: string) =>
    updateTextStyle(selectedIds, { textColor: color }, "text_color");

  return {
    handleDelete,
    handleDuplicate,
    handleBringForward,
    handleSendBack,
    handleBringToFront,
    handleSendToBack,
    handleBold,
    handleItalic,
    handleFontSize,
    handleAlign,
    handleFontFamily,
    handleTextColor,
  };
}
