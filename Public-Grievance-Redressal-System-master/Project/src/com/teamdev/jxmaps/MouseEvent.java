package com.teamdev.jxmaps;
public class MouseEvent {
    private final LatLng position;
    public MouseEvent() { this(new LatLng(19.7515, 75.7139)); }
    public MouseEvent(LatLng position) { this.position = position; }
    public LatLng latLng() { return position; }
}
