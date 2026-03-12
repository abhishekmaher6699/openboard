import { useEffect } from "react"

export function useDelete({
  selectedRef,
  selectionRef,
  onDelete
}: any) {

  useEffect(() => {



    const key = (e:KeyboardEvent) => {

      console.log("key pressed:", e.key)
      console.log("selected:", selectedRef.current)

      if (e.key === "Delete" && selectedRef.current) {

        onDelete(selectedRef.current)

        selectedRef.current = null
        if (selectionRef.current) {
          selectionRef.current.destroy()
          selectionRef.current = null
        }

      }

    }

    window.addEventListener("keydown", key)

    return () => window.removeEventListener("keydown", key)

  }, [onDelete])

}