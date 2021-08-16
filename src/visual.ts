"use strict";

import "core-js/stable";
import "leaflet/dist/leaflet.css";
import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import * as L from 'leaflet';
import * as tileLayers from "../tilelayers.json";
import { VisualSettings } from "./settings";

interface Plot {
    tooltips: string;
    latitude: number;
    longitude: number;
    color: string;
    radius: number;
}

export class Visual implements IVisual {
    private target: HTMLElement;
    private settings: VisualSettings;
    private mapContainer: HTMLElement;
    private map: L.Map;
    private plots: Plot[];
    private markerLayer: L.LayerGroup<L.CircleMarker>;

    constructor(options: VisualConstructorOptions) {
        if (!document) { return; }
        this.target = options.element;
        this.createMapContainer();
        this.configureLeaflet();
    }

    public update(options: VisualUpdateOptions) {
        this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0]);
        this.resizeMap(options);
        this.plots = <Plot[]>this.parseData(options);
        this.drawMarkers();
    }

    public destroy() {
        this.map.remove();
    }

    private configureLeaflet() {
        // create L.Map off of the <div>
        this.map = new L.Map("mapid");
        this.map.setView(new L.LatLng(48.78, 9.18), 13);
        const layers = this.getTileLayers();
        layers.forEach(url => this.map.addLayer(L.tileLayer(url)));
        this.map.attributionControl.setPrefix(false);
    }

    private createMapContainer() {
        // add <div> to the DOM
        const div = document.createElement('div');
        div.id = 'mapid';
        div.style.width = `${this.target.clientWidth}px`;
        div.style.height = `${this.target.clientHeight}px`;
        this.mapContainer = div;
        this.target.append(div);
    }

    private drawMarkers() {
        if (this.markerLayer) this.map.removeLayer(this.markerLayer);

        const markers = this.plots.map(function ({tooltips, latitude, longitude, color, radius}) {
            const latlng = L.latLng([latitude, longitude]);
            const markerOptions: L.CircleMarkerOptions = { 
                color: color || 'Black',
                radius: radius || 10,
                fillOpacity: 0.5
            };
            let marker = L.circleMarker(latlng, markerOptions);
            marker.bindPopup(tooltips || '[Drag a field onto Tooltips]');
            marker.on('mouseover', function (evt) {
                marker.openPopup();
            });
            return marker;
        });

        // place markers on map
        this.markerLayer = L.layerGroup(markers);
        this.map.addLayer(this.markerLayer);

        // zoom out so map shows all points
        var group = L.featureGroup(markers);
        this.map.fitBounds(group.getBounds());
    }

    private getTileLayers(): string[] {
        if (window.location.host  === 'app.powerbi.com') {
            return tileLayers.dev;
        } else if (window.location.host.includes('.mil')) {
            return tileLayers.nipr;
        } else if (window.location.host.includes('smil.mil')) {
            return tileLayers.sipr;
        }
    }

    private parseData(options: VisualUpdateOptions) {
        /*
            Data passed into the visual is based on dataRoles and dataviewMappings
            https://github.com/woodbuffalo/powerbi-leaflet/blob/master/capabilities.json
            Parsing logic is found in the converter() method:
            https://github.com/woodbuffalo/powerbi-leaflet/blob/master/src/visual.ts
        */
        const { columns, rows } = options.dataViews[0].table;
        const data = rows.map(function (row, idx) {
            const item = row.reduce(function (d, v, i) {
                const role = Object.keys(columns[i].roles)[0]
                d[role] = v;
                return d;
            }, {});
            return item;
        });
        return data;
    }

    private static parseSettings(dataView: DataView): VisualSettings {
        return <VisualSettings>VisualSettings.parse(dataView);
    }

    private resizeMap(options: VisualUpdateOptions) {
        const { width, height } = options.viewport;
        this.mapContainer.style.width = width + 'px';
        this.mapContainer.style.height = height + 'px';
        this.map.invalidateSize(true);
    }

    /**
     * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
     * objects and properties you want to expose to the users in the property pane.
     *
     */
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
    }
}