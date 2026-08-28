package com.teamdev.jxmaps;
public class GeocoderResult {
    public Geometry getGeometry() { return new Geometry(); }
    public static class Geometry {
        public LatLng getLocation() { return new LatLng(19.7515, 75.7139); }
    }
}
