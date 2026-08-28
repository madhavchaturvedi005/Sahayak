package com.teamdev.jxmaps;
public class Marker {
    private LatLng position = new LatLng(0, 0);
    public Marker(Map map) {}
    public void setPosition(LatLng position) { this.position = position; }
    public LatLng getPosition() { return position; }
    public void addEventListener(String event, MapMouseEvent listener) {}
    public void remove() {}
}
