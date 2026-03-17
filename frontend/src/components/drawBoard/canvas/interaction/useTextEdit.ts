import { useRef } from "react"
import type { BoardObject } from "../../../../types/board"

type UseTextEditProps = {
  viewportRef: React.RefObject<any>
  interactionRef: React.RefObject<any>
  objectMapRef: React.RefObject<Map<string, BoardObject>>
  onTextChange: (id: string, text: string) => void
  onToolChange: (tool: any) => void
  disabled: boolean | undefined
}

export function useTextEdit({
  viewportRef,
  interactionRef,
  objectMapRef,
  onTextChange,
  onToolChange,
  disabled
}: UseTextEditProps) {


  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const editingIdRef = useRef<string | null>(null)

  function openEditor(id: string) {
    if (disabled) return 

    const viewport = viewportRef.current
    if (!viewport) return

    const canvas = viewport.renderer?.view as HTMLCanvasElement
    if (canvas) canvas.style.pointerEvents = "none"

    if (textareaRef.current) closeEditor(false)


    const obj = objectMapRef.current.get(id)
    if (!obj) return

    const interaction = interactionRef.current
    viewport.plugins.pause("drag")
    interaction.isEditing = true
    editingIdRef.current = id

    interaction.selected = new Set()
    if (interaction.selectionGraphics) {
      interaction.selectionGraphics.visible = false
    }

    const scale = viewport.scale.x
    const screenPos = viewport.toScreen(obj.x, obj.y)

    const textarea = document.createElement("textarea")
    textarea.value = obj.data?.text ?? ""

    Object.assign(textarea.style, {
      position: "fixed",
      left: `${screenPos.x}px`,
      top: `${screenPos.y}px`,
      width: `${(obj.width ?? 200) * scale}px`,
      height: `${(obj.height ?? 120) * scale}px`,
      fontSize: `16px`,
      lineHeight: "1.5",
      padding: "8px",
      border: "2px solid #3b82f6",
      borderRadius: "4px",
      background: obj.type === "text" ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.85)",
      resize: "none",
      outline: "none",
      zIndex: "9999",
      fontFamily: "sans-serif",
      color: "#1a1a1a",
      boxSizing: "border-box",
      textAlign: "center",
      overflow: "hidden",
    })

    document.body.appendChild(textarea)

    setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(textarea.value.length, textarea.value.length)
        }, 0)
    
    textareaRef.current = textarea

    const commit = () => {
      if (!editingIdRef.current) return
      const newText = textarea.value
      onTextChange(editingIdRef.current, newText)
      closeEditor(true)
    }

    const onKeyDown = (e: KeyboardEvent) => {
      e.stopPropagation()
      if (e.key === "Escape") {
        closeEditor(false)
      } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        commit()
      }
    }

    textarea.addEventListener("blur", commit)
    textarea.addEventListener("keydown", onKeyDown)
  }

  function closeEditor(switchToSelect = true) {

    if (disabled) return 

    const viewport = viewportRef.current
    const interaction = interactionRef.current

    // re-enable pointer events on canvas
    const canvas = viewport?.renderer?.view as HTMLCanvasElement
    if (canvas) canvas.style.pointerEvents = "auto"

    if (textareaRef.current) {
      textareaRef.current.remove()
      textareaRef.current = null
    }

    editingIdRef.current = null
    interaction.isEditing = false
    viewport?.plugins.resume("drag")

    if (switchToSelect) {
      onToolChange("select")
    }
  }

  return { openEditor, closeEditor }
}