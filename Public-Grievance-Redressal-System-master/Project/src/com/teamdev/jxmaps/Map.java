package com.teamdev.jxmaps;
import java.util.ArrayList;
import java.util.List;
public class Map {
    private LatLng center = new LatLng(19.7515, 75.7139);
    private final List<MapMouseEvent> clickListeners = new ArrayList<MapMouseEvent>();
    public void setOptions(MapOptions options) {}
    public void setCenter(LatLng center) { this.center = center; }
    public void setZoom(double zoom) {}
    public LatLng getCenter() { return center; }
    public void addEventListener(String event, MapMouseEvent listener) {
        if ("click".equals(event) && listener != null) clickListeners.add(listener);
    }
}
