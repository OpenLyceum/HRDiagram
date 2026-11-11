/**
 * MarkerIconNode.ts
 *
 * A legend swatch drawn exactly like a point-cloud marker (same shape, colour and outline).
 */

import { Bounds2 } from "scenerystack/dot";
import { CanvasNode } from "scenerystack/scenery";
import { type PointStyle, traceMarker } from "./PointCloudNode.js";

export class MarkerIconNode extends CanvasNode {
  private readonly style: PointStyle;

  public constructor(style: PointStyle) {
    const size = 2 * style.radius * 1.4 + 2;
    super({ canvasBounds: new Bounds2(0, 0, size, size) });
    this.style = style;
    this.invalidatePaint();
  }

  public override paintCanvas(context: CanvasRenderingContext2D): void {
    const c = this.canvasBounds.width / 2;
    context.beginPath();
    traceMarker(context, this.style.shape ?? "circle", c, c, this.style.radius);
    context.fillStyle = this.style.css();
    context.fill();
    if (this.style.stroke) {
      context.lineWidth = 0.6;
      context.strokeStyle = this.style.stroke();
      context.stroke();
    }
  }
}
