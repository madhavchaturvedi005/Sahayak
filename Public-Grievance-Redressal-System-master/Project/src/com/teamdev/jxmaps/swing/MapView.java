package com.teamdev.jxmaps.swing;

import com.teamdev.jxmaps.Map;
import com.teamdev.jxmaps.MapReadyHandler;
import com.teamdev.jxmaps.MapServices;
import com.teamdev.jxmaps.MapStatus;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.SwingConstants;
import java.awt.BorderLayout;
import java.awt.Color;

/** Lightweight stand-in for TeamDev JxMaps so the Swing UI can run on macOS. */
public class MapView extends JPanel {
    private final Map map = new Map();
    private final MapServices services = new MapServices();

    public MapView() {
        setLayout(new BorderLayout());
        setBackground(new Color(220, 230, 236));
        JLabel label = new JLabel(
            "<html><center>Map preview<br>JxMaps is not bundled on this Mac.<br>Pins still save if you type coordinates.</center></html>",
            SwingConstants.CENTER
        );
        add(label, BorderLayout.CENTER);
    }

    public void setOnMapReadyHandler(MapReadyHandler handler) {
        if (handler != null) {
            handler.onMapReady(MapStatus.MAP_STATUS_OK);
        }
    }

    public Map getMap() {
        return map;
    }

    public MapServices getServices() {
        return services;
    }
}
