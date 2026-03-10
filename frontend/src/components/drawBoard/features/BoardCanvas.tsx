import { useApplication } from "@pixi/react";
import { Viewport } from "pixi-viewport";
import { Container, Graphics } from "pixi.js";
import { useEffect, useRef } from "react";
import type { BoardObject } from "../../../types/board";

type Props = {
  objects: BoardObject[];
  onMove: (id: string, x: number, y: number) => void;
  onCreate: (x: number, y: number) => void;
};

export default function BoardCanvas({ objects, onMove, onCreate }: Props) {
  const { app } = useApplication();

  const viewportRef = useRef<Viewport | null>(null);
  const itemsLayerRef = useRef<Container | null>(null);


// Setup viewport
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

  
  //  Double click create object
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    let lastClickTime = 0;

    const handlePointerDown = (e: any) => {
      const now = Date.now();

      if (now - lastClickTime < 300) {
        const pos = viewport.toWorld(e.global);
        console.log("Double click detected", pos);
        onCreate(pos.x, pos.y);
      }

      lastClickTime = now;
    };

    viewport.on("pointerdown", handlePointerDown);

    return () => {
      viewport.off("pointerdown", handlePointerDown);
    };
  }, [onCreate]);



  // Render objects
  useEffect(() => {
    const viewport = viewportRef.current;
    const itemsLayer = itemsLayerRef.current;

    if (!viewport || !itemsLayer) return;

    itemsLayer.removeChildren();

    objects.forEach((obj) => {
      const g = new Graphics();

      const width = obj.width ?? 200;
      const height = obj.height ?? 120;

      const color = obj.data?.fill
        ? parseInt(obj.data.fill.replace("#", "0x"))
        : 0xff0000;

      g.rect(0, 0, width, height);
      g.fill(color);

      g.x = obj.x;
      g.y = obj.y;

      g.eventMode = "static";
      g.cursor = "pointer";

      let dragging = false;
      let offsetX = 0;
      let offsetY = 0;

      g.on("pointerdown", (e) => {
        e.stopPropagation();

        dragging = true;

        const pos = viewport.toWorld(e.global);

        offsetX = pos.x - g.x;
        offsetY = pos.y - g.y;

        viewport.plugins.pause("drag");
      });

      viewport.on("pointermove", (e) => {
        if (!dragging) return;

        const pos = viewport.toWorld(e.global);

        g.x = pos.x - offsetX;
        g.y = pos.y - offsetY;
      });

      viewport.on("pointerup", (e) => {
        if (!dragging) return;

        dragging = false;

        viewport.plugins.resume("drag");

        const pos = viewport.toWorld(e.global);

        onMove(obj.id, pos.x - offsetX, pos.y - offsetY);
      });

      viewport.on("pointerupoutside", () => {
        dragging = false;
        viewport.plugins.resume("drag");
      });

      itemsLayer.addChild(g);
    });
  }, [objects, onMove]);

  return null;
}
