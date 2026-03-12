import { Graphics } from "pixi.js"
import React, { useEffect, useRef } from "react"
import type { BoardObject } from "../../../types/board"

type UseShapeRendererProps = {
    objects: BoardObject[],
    viewportRef: React.RefObject<any>,
    itemsLayerRef: React.RefObject<any>,
    selectedRef: React.RefObject<string | null>,
    selectionRef: React.RefObject<any>,
    activeDragRef: React.RefObject<any>,
    drawSelection: (obj: BoardObject) => void
}

export function useShapeRenderer({
  objects,
  viewportRef,
  itemsLayerRef,
  selectedRef,
  selectionRef,
  activeDragRef,
  drawSelection
}: UseShapeRendererProps) {

  const graphicsMapRef = useRef<Map<string, Graphics>>(new Map())

  
  useEffect(() => {

    const viewport = viewportRef.current
    const itemsLayer = itemsLayerRef.current
    const graphicsMap = graphicsMapRef.current

    if (!viewport || !itemsLayer) return

    const nextIds = new Set(objects.map(o => o.id))
    graphicsMap.forEach((g, id) => {
        if (!nextIds.has(id)) {
            itemsLayer.removeChild(g)
            g.destroy()
            graphicsMap.delete(id)
        }

    })

    objects.forEach(obj => {

      let g = graphicsMap.get(obj.id)

      const width = obj.width ?? 200
      const height = obj.height ?? 120

      if (!g) {

        g = new Graphics()

        g.rect(0,0,width,height)
        g.fill(0xff0000)

        g.eventMode = "static"
        g.cursor = "pointer"

        itemsLayer.addChild(g)

        graphicsMap.set(obj.id,g)

        g.on("pointerdown",(e:any)=>{

          e.stopPropagation()

          selectedRef.current = obj.id

          drawSelection({
            ...obj,
            x:g!.x,
            y:g!.y
          })

          const pos = viewport.toWorld(e.global)

          activeDragRef.current = {
            id: obj.id,
            graphics:g,
            offsetX: pos.x - g!.x,
            offsetY: pos.y - g!.y
          }

          viewport.plugins.pause("drag")

        })

      }

      g.x = obj.x
      g.y = obj.y

      if(selectedRef.current === obj.id && selectionRef.current){

        selectionRef.current.x = obj.x
        selectionRef.current.y = obj.y

      }

    })

  }, [objects])

}