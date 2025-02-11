function initStorage() {
    document.getElementById("saveFile").addEventListener("click", saveData);
    document.getElementById("loadFile").addEventListener("click", function () {
        document.getElementById("fileInput").click();
    });
    document.getElementById("fileInput").addEventListener("change", loadData);
}

function saveData() {
    var data = {
        profondeur: profondeur,
        pente: pente,
        polygonCoords: polygon ? polygon.getLatLngs()[0].map(latlng => [latlng.lat, latlng.lng]) : null
    };

    var blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "carte.json";
    link.click();
}

function loadData(event) {
    var file = event.target.files[0];
    var reader = new FileReader();

    reader.onload = function (e) {
        var data = JSON.parse(e.target.result);
        
        // 🔹 Supprimer l'ancien polygone s'il existe
        if (polygon) {
            map.removeLayer(polygon);
            polygon = null;
        }

        // 🔹 Supprimer les buffers et les distances si existants
        if (bufferDemiLayer) {
            map.removeLayer(bufferDemiLayer);
            bufferDemiLayer = null;
        }
        if (bufferFondLayer) {
            map.removeLayer(bufferFondLayer);
            bufferFondLayer = null;
        }
        distanceLabels.forEach(label => map.removeLayer(label));
        distanceLabels = []; 

        // 🔹 Charger un nouveau polygone avec les événements initiaux
        if (data.polygonCoords) {
            polygon = L.polygon(data.polygonCoords).addTo(map);
            polygon.enableEdit();  // Rendre le polygone éditable
            map.fitBounds(polygon.getBounds());

            // 🔥 Ajouter les événements comme dans `initPolygon()`
            polygon.on('editable:editing', updatePolygon);
            polygon.on('editable:vertex:drag', updatePolygon);
            polygon.on('editable:vertex:new', updatePolygon);
            polygon.on('editable:vertex:deleted', updatePolygon);
            polygon.on('editable:dragend', updatePolygon);

            polygon.on('dblclick', function(e) {
                map.removeLayer(polygon);
                polygon = null;
                distanceLabels.forEach(label => map.removeLayer(label));
                distanceLabels = [];
            });

            // 🛠 Mettre à jour immédiatement la surface et les distances
            updatePolygon();
        }

        // 🔹 Mettre à jour profondeur et pente si elles existent dans le fichier
        if (data.profondeur !== undefined) {
            profondeur = data.profondeur;
            if (profondeurSlider) {
                profondeurSlider.value = profondeur;
                profondeurValue.textContent = profondeur; // 🔥 MAJ visuelle
            }
        }

        if (data.pente !== undefined) {
            pente = data.pente;
            if (penteSlider) {
                penteSlider.value = pente;
                penteValue.textContent = pente; // 🔥 MAJ visuelle
            }
        }

        // 🔄 Mettre à jour le buffer après le chargement
        updateBufferFond();
        updateBufferDemi();
        
        console.log("📂 Polygone chargé avec succès !");
    };

    reader.readAsText(file);
}

