# Leaflet Map PowerBI Visual
Data bound custom visual that can be used with Datasets with LAT/LONG coordinates.

## Create a tilelayers.json in project root directory
This file will not be checked into your source control.  This file should have the following format.
```
{
    "dev": [
        "http://{s}.tile.osm.org/{z}/{x}/{y}.png"
    ],
    "nipr": [],
    "sipr": []
}
```