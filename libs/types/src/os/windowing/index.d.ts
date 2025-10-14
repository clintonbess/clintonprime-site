export type WindowId = string;
export interface WindowLayoutState {
    id: WindowId;
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex?: number;
}
