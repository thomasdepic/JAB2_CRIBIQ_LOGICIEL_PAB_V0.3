let intersectionLayer = null;  // Les points d'intersections
let gridLayer = null;  // La grille de lignes
let lines = [];  // Stocke toutes les lignes du quadrillage

let cellSizeMeters = 10; // Taille initiale des cellules en mètres
let cellSizeSlider = document.getElementById("cellSizeSlider");
let cellSizeValue = document.getElementById("cellSizeValue");

// 🔄 Mettre à jour la valeur de la cellule lorsque le curseur est ajusté
cellSizeSlider.addEventListener("input", function () {
    cellSizeMeters = parseFloat(this.value);
    cellSizeValue.textContent = cellSizeMeters;
    console.log("📏 Nouvelle distance entre les sommets :", cellSizeMeters, "m");

    // Recalculer la grille avec la nouvelle taille
    generateIntersections();
});

// 🔹 Mise à jour de `generateIntersections()` pour utiliser `cellSizeMeters`
function generateIntersections() {
    if (!bufferDemiLayer) {
        alert("Veuillez d'abord dessiner un polygone.");
        return;
    }

    if (typeof map === "undefined" || !map) {
        console.error("⚠️ La carte 'map' n'est pas disponible !");
        return;
    }

    // Supprimer les anciennes couches (intersections et grille)
    if (intersectionLayer) map.removeLayer(intersectionLayer);
    if (gridLayer) map.removeLayer(gridLayer);

    // Créer de nouvelles couches
    intersectionLayer = L.layerGroup().addTo(map);
    gridLayer = L.layerGroup().addTo(map);
    lines = [];

    // Récupérer la bounding box du buffer
    var bounds = bufferDemiLayer.getBounds();
    var southWest = bounds.getSouthWest();
    var northEast = bounds.getNorthEast();

    // 🔹 **Calcul de la taille des cellules une seule fois**
    var startPoint = turf.point([southWest.lng, southWest.lat]);
    var endPointLng = turf.destination(startPoint, cellSizeMeters / 1000, 90, { units: "kilometers" }); // Vers l'Est
    var endPointLat = turf.destination(startPoint, cellSizeMeters / 1000, 0, { units: "kilometers" });  // Vers le Nord

    var cellSizeLng = endPointLng.geometry.coordinates[0] - southWest.lng;
    var cellSizeLat = endPointLat.geometry.coordinates[1] - southWest.lat;

    console.log("📏 Cellule carrée optimisée :", cellSizeMeters, "m ->", cellSizeLat.toFixed(6), "° (lat) &", cellSizeLng.toFixed(6), "° (lng)");

    // 🔥 **Tracer la grille sans recalculer à chaque ligne**
    let latValues = [];
    let lngValues = [];

    for (let lat = southWest.lat; lat <= northEast.lat; lat += cellSizeLat) {
        latValues.push(lat);
    }
    for (let lng = southWest.lng; lng <= northEast.lng; lng += cellSizeLng) {
        lngValues.push(lng);
    }

    // 🔹 **Tracer les lignes horizontales**
    latValues.forEach(lat => {
        let start = L.latLng(lat, southWest.lng);
        let end = L.latLng(lat, northEast.lng);
        let line = L.polyline([start, end], { color: 'black', weight: 1 }).addTo(gridLayer);
        lines.push(line);
        findIntersections(line, bufferDemiLayer, "red");
        findIntersections(line, bufferFondLayer, "blue");
    });

    // 🔹 **Tracer les lignes verticales**
    lngValues.forEach(lng => {
        let start = L.latLng(southWest.lat, lng);
        let end = L.latLng(northEast.lat, lng);
        let line = L.polyline([start, end], { color: 'black', weight: 1 }).addTo(gridLayer);
        lines.push(line);
        findIntersections(line, bufferDemiLayer, "red");
        findIntersections(line, bufferFondLayer, "blue");
    });

    // Calculer les intersections entre les lignes du quadrillage
    calculateLineIntersections();
}





// Fonction pour calculer les intersections entre une ligne et une ligne de niveau
function findIntersections(line, ligneDeNiveau, color) {
    var latlngs = line.getLatLngs();
    var lineGeoJSON = turf.lineString(latlngs.map(latlng => [latlng.lng, latlng.lat]));

    // Vérifier si le buffer existe bien
    if (!ligneDeNiveau) {
        console.error("⚠️ Le bufferLayer est introuvable.");
        return;
    }

    var bufferGeoJSON = ligneDeNiveau.toGeoJSON();
    var intersections = turf.lineIntersect(lineGeoJSON, bufferGeoJSON);

    intersections.features.forEach(function (point) {
        var latlng = L.latLng(point.geometry.coordinates[1], point.geometry.coordinates[0]);
        L.circleMarker(latlng, { color: color, radius: 5 }).addTo(intersectionLayer);
    });
}

// Fonction pour calculer les intersections entre les lignes du quadrillage
function calculateLineIntersections() {
    if (!bufferFondLayer) {
        console.error("⚠️ Le bufferLayer est introuvable.");
        return;
    }

    var bufferGeoJSON = bufferFondLayer.toGeoJSON();

    for (let i = 0; i < lines.length; i++) {
        for (let j = i + 1; j < lines.length; j++) {
            let line1 = lines[i];
            let line2 = lines[j];

            let intersection = getLineIntersection(line1, line2);
            if (intersection && turf.booleanPointInPolygon(turf.point([intersection.lng, intersection.lat]), bufferGeoJSON)) {
                L.circleMarker(intersection, { color: 'green', radius: 5 }).addTo(intersectionLayer);
            }
        }
    }
}

// Fonction pour obtenir l'intersection entre 2 lignes
function getLineIntersection(line1, line2) {
    var latlngs1 = line1.getLatLngs();
    var latlngs2 = line2.getLatLngs();

    var line1GeoJSON = turf.lineString(latlngs1.map(latlng => [latlng.lng, latlng.lat]));
    var line2GeoJSON = turf.lineString(latlngs2.map(latlng => [latlng.lng, latlng.lat]));

    var intersection = turf.lineIntersect(line1GeoJSON, line2GeoJSON);

    if (intersection.features.length > 0) {
        var point = intersection.features[0].geometry.coordinates;
        return L.latLng(point[1], point[0]);
    }

    return null;
}

// Initialisation du module Intersections
function initIntersections() {
    console.log("📌 Initialisation du module Intersections...");

    console.log("✅ Module Intersections initialisé.");
}
