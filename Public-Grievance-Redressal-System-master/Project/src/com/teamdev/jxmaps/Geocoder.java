package com.teamdev.jxmaps;
public class Geocoder {
    public void geocode(GeocoderRequest request, GeocoderCallback callback) {
        if (callback != null) callback.onComplete(new GeocoderResult[] { new GeocoderResult() }, GeocoderStatus.OK);
    }
}
