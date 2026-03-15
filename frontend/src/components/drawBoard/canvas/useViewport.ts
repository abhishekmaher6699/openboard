import { Viewport } from "pixi-viewport"
import { Container } from "pixi.js"
import { useEffect, useRef } from "react"

export function useViewport(app: any) {
  const viewportRef = useRef<Viewport | null>(null)
  const itemsLayerRef = useRef<Container | null>(null)
  const overlayLayerRef = useRef<Container | null>(null)

  useEffect(() => {
    if (!app) return

    const viewport = new Viewport({
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      worldWidth: 100000,
      worldHeight: 100000,
      events: app.renderer.events,
    })

    viewport.drag().wheel().pinch()

    const itemsLayer = new Container()
    const overlayLayer = new Container()

    viewport.addChild(itemsLayer)
    viewport.addChild(overlayLayer)

    app.stage.addChild(viewport)

    viewportRef.current = viewport
    itemsLayerRef.current = itemsLayer
    overlayLayerRef.current = overlayLayer

    return () => viewport.destroy()
  }, [app])

  return { viewportRef, itemsLayerRef, overlayLayerRef }
}