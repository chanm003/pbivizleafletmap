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
export class Visual implements IVisual {
    private target: HTMLElement;
    private settings: VisualSettings;
    private mapContainer: HTMLElement;
    private map: L.Map;

    constructor(options: VisualConstructorOptions) {
        if (!document) { return; }
        this.target = options.element;
        this.createMapContainer();
        this.configureLeaflet();
    }

    public update(options: VisualUpdateOptions) {
        this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0]);
        this.resizeMap(options);
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

    private getTileLayers(): string[] {
        if (window.location.host  === 'app.powerbi.com') {
            return tileLayers.dev;
        } else if (window.location.host.includes('.mil')) {
            return tileLayers.nipr;
        } else if (window.location.host.includes('smil.mil')) {
            return tileLayers.sipr;
        }
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