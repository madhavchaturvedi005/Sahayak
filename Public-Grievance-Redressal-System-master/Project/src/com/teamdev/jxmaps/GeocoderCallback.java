package com.teamdev.jxmaps;
public abstract class GeocoderCallback {
    public GeocoderCallback(Map map) {}
    public abstract void onComplete(GeocoderResult[] result, GeocoderStatus status);
}
