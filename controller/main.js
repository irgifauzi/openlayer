import Map from 'https://cdn.skypack.dev/ol/Map.js';
import View from 'https://cdn.skypack.dev/ol/View.js';
import TileLayer from 'https://cdn.skypack.dev/ol/layer/Tile.js';
import OSM from 'https://cdn.skypack.dev/ol/source/OSM.js';
import Overlay from 'https://cdn.skypack.dev/ol/Overlay.js';
import { toLonLat } from 'https://cdn.skypack.dev/ol/proj.js';
import { Feature } from 'https://cdn.skypack.dev/ol/index.js';
import { Point } from 'https://cdn.skypack.dev/ol/geom.js';
import VectorSource from 'https://cdn.skypack.dev/ol/source/Vector.js';
import VectorLayer from 'https://cdn.skypack.dev/ol/layer/Vector.js';
import { Style, Icon } from 'https://cdn.skypack.dev/ol/style.js';
import { fromLonLat } from 'https://cdn.skypack.dev/ol/proj.js';
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/src/sweetalert2.js";
import {addCSS} from "https://cdn.jsdelivr.net/gh/jscroot/lib@0.0.9/element.js";

addCSS("https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.css");



const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
  ],
  view: new View({
    center: fromLonLat([107.6191, -6.9175]), 
    zoom: 12,
  }),
});

function getGeolocationAddress(latitude, longitude) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
  
  return fetch(url)
    .then(response => response.json())
    .then(data => data.display_name)
    .catch(error => {
      console.error("Error fetching geolocation address:", error);
      return "Lokasi tidak ditemukan";
    });
}

function setDefaultLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const userLocation = fromLonLat([longitude, latitude]);
        map.getView().setCenter(userLocation);
        map.getView().setZoom(14);

        // Dapatkan nama lokasi menggunakan fungsi geocoding
        const locationName = await getGeolocationAddress(latitude, longitude);

        // Tambahkan marker di lokasi pengguna
        const userMarker = new Feature({
          geometry: new Point(userLocation),
          name: 'Lokasi Saya',
        });
        userMarker.setStyle(
          new Style({
            image: new Icon({
              src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
              scale: 0.05,
            }),
          })
        );
        markerSource.addFeature(userMarker);

        // Simpan data marker ke dalam markerData
        markerData.set(userMarker, { 
          placeName: locationName, 
          volume: `Long: ${longitude.toFixed(6)}, Lat: ${latitude.toFixed(6)}` 
        });

        // Tampilkan informasi lokasi dengan popup
        Swal.fire({
          title: 'Lokasi Saya!',
          text: `Nama Lokasi: ${locationName}\nLong: ${longitude.toFixed(6)}, Lat: ${latitude.toFixed(6)}`,
          icon: 'success',
          confirmButtonText: 'OK',
        });
      },
      (error) => {
        console.error('Error mendapatkan lokasi:', error);
        Swal.fire({
          title: 'Gagal Mendapatkan Lokasi',
          text: 'Periksa pengaturan lokasi di perangkat Anda.',
          icon: 'error',
          confirmButtonText: 'OK',
        });
      }
    );
  } else {
    Swal.fire({
      title: 'Geolokasi Tidak Didukung',
      text: 'Browser Anda tidak mendukung geolokasi.',
      icon: 'warning',
      confirmButtonText: 'OK',
    });
  }
}

// Panggil fungsi untuk mendapatkan lokasi pengguna saat pertama kali peta dimuat
setDefaultLocation();


// Panggil fungsi untuk mendapatkan lokasi pengguna saat pertama kali peta dimuat
setDefaultLocation();

const markerSource = new VectorSource();
const markerLayer = new VectorLayer({
  source: markerSource,
});
map.addLayer(markerLayer);

const popup = document.createElement('div');
popup.className = 'popup';
popup.innerHTML = `
  <div>
    <div id="info"></div>
    <label for="placeName">Nama: </label>
    <input type="text" id="placeName" placeholder="Nama Tempat" /><br />
    <label for="volume">Volume: </label>
    <input type="text" id="volume" placeholder="Volume" /><br />
    <button id="saveButton">Tambah Tempat</button>
  </div>`;
document.body.appendChild(popup);

const overlay = new Overlay({
  element: popup,
  autoPan: true,
});
map.addOverlay(overlay);

const infoPopup = document.createElement('div');
infoPopup.className = 'popup';
document.body.appendChild(infoPopup);

const infoOverlay = new Overlay({
  element: infoPopup,
  autoPan: true,
});
map.addOverlay(infoOverlay);

let currentCoordinates = null;
const markerData = new Map(); // Store marker data by feature

map.on('singleclick', (event) => {
  currentCoordinates = event.coordinate;
  const [lon, lat] = toLonLat(currentCoordinates);

  const info = document.getElementById('info');
  info.innerHTML = ` 
    <strong>Long:</strong> ${lon.toFixed(6)}<br />
    <strong>Lat:</strong> ${lat.toFixed(6)}
  `;

  overlay.setPosition(currentCoordinates);
});

document.getElementById('saveButton').addEventListener('click', () => {
  const placeName = document.getElementById('placeName').value;
  const volume = document.getElementById('volume').value;

  if (placeName) {
    const [lon, lat] = toLonLat(currentCoordinates); // Konversi koordinat ke longitude dan latitude
    const fullVolume = `${volume} (Long: ${lon.toFixed(6)}, Lat: ${lat.toFixed(6)})`; // Tambahkan longlat ke volume

    const marker = new Feature({
      geometry: new Point(currentCoordinates),
      id: Math.floor(Math.random() * 1000), // Random ID untuk setiap marker
      name: placeName,
      volume: fullVolume, // Gunakan fullVolume
    });
    marker.setStyle(
      new Style({
        image: new Icon({
          src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
          scale: 0.05,
        }),
      })
    );
    markerSource.addFeature(marker);

    // Simpan data marker ke dalam markerData
    markerData.set(marker, { placeName, volume: fullVolume });

    overlay.setPosition(undefined); // Sembunyikan popup input
    Swal.fire({
      title: 'Data Disimpan',
      text: `Nama: ${placeName}\nVolume: ${fullVolume}`, // Tampilkan informasi lengkap
      icon: 'success',
      confirmButtonText: 'OK',
    });
  } else {
    Swal.fire({
      title: 'Error',
      text: 'Silakan masukkan Nama dan Volume!',
      icon: 'error',
      confirmButtonText: 'OK',
    });
  }
});


// Menangani klik untuk menampilkan informasi tempat
map.on('singleclick', (event) => {
  map.forEachFeatureAtPixel(event.pixel, (feature) => {
    const data = markerData.get(feature);
    if (data) {
      const { placeName, volume } = data;
      Swal.fire({
        title: `Data Tempat`,
        html: `<strong>Nama:</strong> ${placeName}<br><strong>Volume:</strong> ${volume}`,
        icon: 'info',
        confirmButtonText: 'OK',
      });
    }
  });
});
