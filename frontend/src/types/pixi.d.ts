import { Viewport } from "pixi-viewport";

declare global {
  namespace JSX {
    interface IntrinsicElements {
        pixiViewport: any;
        }
    }
}