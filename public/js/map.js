// Enhanced Mapbox GL JS Integration for Gaman 2.0
if (typeof mapToken !== 'undefined' && typeof listing !== 'undefined' && listing.geometry && listing.geometry.coordinates) {
    
    mapboxgl.accessToken = mapToken;
    const centerCoords = listing.geometry.coordinates;

    const map = new mapboxgl.Map({
        container: 'map', // container ID
        center: centerCoords, // starting position [lng, lat]
        style: 'mapbox://styles/mapbox/streets-v12', // style URL
        zoom: 13, // starting zoom (zoomed in closer for POIs)
        cooperativeGestures: true // touch scroll-friendly on mobile
    });

    // Add navigation controls (zoom buttons)
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Create a custom HTML element for Gaman stay area marker (Airbnb circular area style)
    const el = document.createElement('div');
    el.style.width = '64px';
    el.style.height = '64px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = 'rgba(255, 56, 92, 0.15)';
    el.style.border = '2px solid #FF385C';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.boxShadow = '0 0 16px rgba(255, 56, 92, 0.2)';
    el.innerHTML = `
        <div style="width: 24px; height: 24px; border-radius: 50%; background-color: #FF385C; display: flex; align-items: center; justify-content: center; color: white; box-shadow: var(--shadow);">
            <i class="fa-solid fa-house" style="font-size: 0.75rem;"></i>
        </div>
    `;

    // Primary Marker
    new mapboxgl.Marker({ element: el })
        .setLngLat(centerCoords)
        .setPopup(new mapboxgl.Popup({ offset: 35 })
        .setHTML(`
            <div style="font-family: var(--font-main);">
                <h3 style="font-size: 0.95rem; font-weight: 800; color: var(--secondary); margin-bottom: 2px;">${listing.title}</h3>
                <p style="font-size: 0.8rem; color: #717171; margin: 0;">Stay area near ${listing.location}</p>
            </div>
        `))
        .addTo(map);

    // Nearby Points of Interest (POIs) details markers
    const pois = [
        {
            name: "Cafe De Flora",
            type: "dining",
            icon: "fa-utensils",
            color: "#FF5A5F",
            coords: [centerCoords[0] + 0.005, centerCoords[1] + 0.003]
        },
        {
            name: "Sunset View Point",
            type: "nature",
            icon: "fa-tree",
            color: "#484848",
            coords: [centerCoords[0] - 0.004, centerCoords[1] - 0.003]
        },
        {
            name: "City Junction Bus Stop",
            type: "transit",
            icon: "fa-bus",
            color: "#2B6CB0",
            coords: [centerCoords[0] + 0.003, centerCoords[1] - 0.004]
        }
    ];

    pois.forEach(poi => {
        // Create custom POI marker element
        const pin = document.createElement('div');
        pin.style.width = '28px';
        pin.style.height = '28px';
        pin.style.borderRadius = '50%';
        pin.style.backgroundColor = poi.color;
        pin.style.display = 'flex';
        pin.style.alignItems = 'center';
        pin.style.justifyContent = 'center';
        pin.style.color = 'white';
        pin.style.cursor = 'pointer';
        pin.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
        pin.style.border = '2px solid white';
        pin.innerHTML = `<i class="fa-solid ${poi.icon}" style="font-size: 0.75rem;"></i>`;

        new mapboxgl.Marker({ element: pin })
            .setLngLat(poi.coords)
            .setPopup(new mapboxgl.Popup({ offset: 15 })
            .setHTML(`
                <div style="font-family: var(--font-main); min-width: 120px;">
                    <strong style="font-size: 0.85rem; display: block; color: var(--secondary);">${poi.name}</strong>
                    <span style="font-size: 0.75rem; color: #717171; text-transform: capitalize;">${poi.type} attraction</span>
                </div>
            `))
            .addTo(map);
    });

}