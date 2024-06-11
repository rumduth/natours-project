export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiZHV0aG5nIiwiYSI6ImNseDVwOXhvdjA3M3gyanB5eTZ4ZXN6aGoifQ.YKRpiQtaCCQb-ya1tc9kDg';
  const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/duthng/clx5q4ypv03ci01qm6l8ngd7r', // style URL
    center: [-118.11, 34.111745], // starting position [lng, lat]
    scrollZoom: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    //Add marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker to map
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    //Add popip
    new mapboxgl.Popup({ offset: 30 })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    //Extend the map bound to include the current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
