import { useApplication } from "@pixi/react";
import { Viewport } from "pixi-viewport";
import { Container, Graphics } from "pixi.js";
import { useEffect, useRef } from "react";
import type { Shape } from "../../../types/board";

type Props = {
  shapes: Shape[];
  //   onMove: (id: string, x: number, y: number) => void
};

export default function BoardCanvas({ shapes }: Props) {
  const { app } = useApplication();

  const viewportRef = useRef<Viewport | null>(null);
  const itemsLayerRef = useRef<Container | null>(null);

  useEffect(() => {
    if (!app) return;

    const viewport = new Viewport({
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      worldWidth: 100000,
      worldHeight: 100000,
      events: app.renderer.events,
      passiveWheel: false,
    });

    viewport.drag().wheel({ percent: 0.15 }).pinch();

    viewport.clampZoom({
      minScale: 0.2,
      maxScale: 5,
    });

    viewport.moveCenter(0, 0);

    const itemsLayer = new Container();

    viewport.addChild(itemsLayer);
    app.stage.addChild(viewport);

    viewportRef.current = viewport;
    itemsLayerRef.current = itemsLayer;

    const resize = () => {
      viewport.resize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      viewport.destroy();
    };
  }, [app]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const itemsLayer = itemsLayerRef.current;

    if (!viewport || !itemsLayer) return;

    itemsLayer.removeChildren();

    shapes.forEach((shape) => {
      const g = new Graphics();

      g.rect(0, 0, shape.width, shape.height);
      g.fill(shape.color);

      g.x = shape.x;
      g.y = shape.y;

      g.eventMode = "static";
      g.cursor = "pointer";

      let dragging = false;
      let offsetX = 0;
      let offsetY = 0;

      g.on("pointerdown", (e) => {
        e.stopPropagation(); // prevent viewport drag

        dragging = true;

        const pos = viewport.toWorld(e.global);

        offsetX = pos.x - g.x;
        offsetY = pos.y - g.y;
      });

      g.on("pointermove", (e) => {
        if (!dragging) return;

        const pos = viewport.toWorld(e.global);

        g.x = pos.x - offsetX;
        g.y = pos.y - offsetY;
      });

      g.on("pointerup", (e) => {
        if (!dragging) return;

        dragging = false;

        const pos = viewport.toWorld(e.global);
        console.log(`Moved shape ${shape.id} to (${pos.x - offsetX}, ${pos.y - offsetY})`);

        //   onMove(shape.id, pos.x - offsetX, pos.y - offsetY);
      });

      g.on("pointerupoutside", () => {
        dragging = false;
      });

      itemsLayer.addChild(g);
    });
  }, [shapes]);

  return null;
}
