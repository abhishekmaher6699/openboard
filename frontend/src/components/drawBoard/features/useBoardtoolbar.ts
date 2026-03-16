import type { BoardObject } from "../../../types/board";
import { createObject, updateObject } from "../../../api/board_objects";

const STEP = 1000
const RENORMALIZE_EPSILON = 1

type Props = {
  boardId: string;
  selectedIds: string[];
  objectsRef: React.RefObject<BoardObject[]>;
  setObjects: React.Dispatch<React.SetStateAction<BoardObject[]>>;
  createNewObject: (type: string, x: number, y: number) => Promise<string | null>;
  sendCreate: (object: BoardObject) => void;
  sendUpdate: (id: string, changes: any) => void;
  deleteObject: (id: string) => void;
  deleteManyObjects: (ids: string[]) => void;
  clearSelectionRef: React.RefObject<() => void>;
  hideToolbar: () => void;
};

export function useBoardToolbar({
  boardId,
  selectedIds,
  objectsRef,
  setObjects,
  createNewObject,
  sendCreate,
  sendUpdate,
  deleteObject,
  deleteManyObjects,
  clearSelectionRef,
  hideToolbar,
}: Props) {

  const getSorted = () =>
    [...objectsRef.current].sort((a, b) => (a.z_index ?? 0) - (b.z_index ?? 0))

  const applyZUpdate = async (id: string, newZ: number) => {
    setObjects(prev => prev.map(o => o.id === id ? { ...o, z_index: newZ } : o))
    sendUpdate(id, { z_index: newZ })
    await updateObject(boardId, id, { z_index: newZ })
  }

  const renormalize = async () => {
    const sorted = getSorted()
    const updates = sorted.map((o, i) => ({ ...o, z_index: i * STEP }))
    setObjects(prev => prev.map(o => {
      const u = updates.find(u => u.id === o.id)
      return u ? { ...o, z_index: u.z_index } : o
    }))
    updates.forEach(u => sendUpdate(u.id, { z_index: u.z_index }))
    await Promise.all(updates.map(u => updateObject(boardId, u.id, { z_index: u.z_index })))
    return updates
  }

  // ── One-step layering ──────────────────────────────────────────────

  const handleBringForward = async () => {
    for (const id of selectedIds) {
      let sorted = getSorted()
      let idx = sorted.findIndex(o => o.id === id)
      if (idx === sorted.length - 1) return

      let above: number = sorted[idx + 1].z_index ?? 0
      let twoAbove: number = sorted[idx + 2]?.z_index ?? above + STEP * 2
      let newZ: number = Math.floor((above + twoAbove) / 2)

      // if no integer fits between above and twoAbove, renormalize first
      if (twoAbove - above < RENORMALIZE_EPSILON * 2) {
        const updates = await renormalize()
        sorted = [...updates].sort((a, b) => a.z_index - b.z_index)
        idx = sorted.findIndex(u => u.id === id)
        if (idx === sorted.length - 1) return
        above = sorted[idx + 1].z_index ?? 0
        twoAbove = sorted[idx + 2]?.z_index ?? above + STEP * 2
        newZ = Math.floor((above + twoAbove) / 2)
      }

      await applyZUpdate(id, newZ)
    }
  }

  const handleSendBack = async () => {
    for (const id of selectedIds) {
      let sorted = getSorted()
      let idx = sorted.findIndex(o => o.id === id)
      if (idx === 0) return

      let below: number = sorted[idx - 1].z_index ?? 0
      let twoBelow: number = sorted[idx - 2]?.z_index ?? below - STEP * 2
      let newZ: number = Math.floor((below + twoBelow) / 2)

      if (below - twoBelow < RENORMALIZE_EPSILON * 2) {
        const updates = await renormalize()
        sorted = [...updates].sort((a, b) => a.z_index - b.z_index)
        idx = sorted.findIndex(u => u.id === id)
        if (idx === 0) return
        below = sorted[idx - 1].z_index ?? 0
        twoBelow = sorted[idx - 2]?.z_index ?? below - STEP * 2
        newZ = Math.floor((below + twoBelow) / 2)
      }

      await applyZUpdate(id, newZ)
    }
  }

  // ── Extreme layering ───────────────────────────────────────────────

  const handleBringToFront = async () => {
    for (const id of selectedIds) {
      const sorted = getSorted()
      if (sorted[sorted.length - 1]?.id === id) return
      const maxZ = sorted[sorted.length - 1]?.z_index ?? 0
      await applyZUpdate(id, maxZ + STEP)
    }
  }

  const handleSendToBack = async () => {
    for (const id of selectedIds) {
      const sorted = getSorted()
      if (sorted[0]?.id === id) return
      const minZ = sorted[0]?.z_index ?? 0
      await applyZUpdate(id, minZ - STEP)
    }
  }

  // ── Other actions ──────────────────────────────────────────────────

  const handleDelete = () => {
    if (selectedIds.length === 1) deleteObject(selectedIds[0]);
    else if (selectedIds.length > 1) deleteManyObjects(selectedIds);
    clearSelectionRef.current();
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
        setObjects(prev => [...prev, created]);
        sendCreate(created);
      } catch (err) {
        console.error("Duplicate failed", err);
      }
    }
  };

  const updateTextStyle = async (ids: string[], style: Record<string, any>) => {
    setObjects((prev) => prev.map((obj) =>
      ids.includes(obj.id) ? { ...obj, data: { ...obj.data, ...style } } : obj
    ));
    ids.forEach(id => sendUpdate(id, { data: style }));
    await Promise.all(ids.map((id) => {
      const existing = objectsRef.current.find((o) => o.id === id)?.data ?? {};
      return updateObject(boardId, id, { data: { ...existing, ...style } });
    }));
  };

  const handleBold = () => {
    const obj = objectsRef.current.find((o) => selectedIds.includes(o.id) && o.type === "text");
    updateTextStyle(selectedIds, { bold: !obj?.data?.bold });
  };

  const handleItalic = () => {
    const obj = objectsRef.current.find((o) => selectedIds.includes(o.id) && o.type === "text");
    updateTextStyle(selectedIds, { italic: !obj?.data?.italic });
  };

  const handleFontSize = (size: number) => updateTextStyle(selectedIds, { fontSize: size });
  const handleAlign = (align: "left" | "center" | "right") => updateTextStyle(selectedIds, { align });
  const handleFontFamily = (fontFamily: string) => updateTextStyle(selectedIds, { fontFamily });

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
  };
}