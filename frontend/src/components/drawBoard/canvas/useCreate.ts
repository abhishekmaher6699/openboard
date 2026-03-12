import { useEffect } from "react"

export function useCreate({
  viewportRef,
  tool,
  onCreate
}: any) {

  useEffect(() => {

    const viewport = viewportRef.current
    if (!viewport) return

    let lastClick = 0

    const down = (e:any) => {

      const now = Date.now()

      if (now - lastClick < 300) {

        const pos = viewport.toWorld(e.global)

        onCreate(tool, pos.x, pos.y)

      }

      lastClick = now

    }

    viewport.on("pointerdown", down)

    return () => viewport.off("pointerdown", down)

  }, [tool, onCreate])

}