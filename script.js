// Inicializar el mapa centrado en Tacna
const map = L.map('map').setView([-18.006567, -70.246274], 13);

// Añadir capa del mapa
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Array para almacenar negocios
let businesses = JSON.parse(localStorage.getItem('businesses')) || [];
let visitedPlaces = JSON.parse(localStorage.getItem('visitedPlaces')) || [];

// Marcadores del mapa
let markers = [];

// Elementos del DOM
const businessForm = document.getElementById('business-form');
const businessModal = document.getElementById('business-modal');
const closeModal = document.querySelector('.close');
const markVisitedBtn = document.getElementById('mark-visited');

// Cargar negocios existentes
function loadBusinesses() {
    // Limpiar marcadores existentes
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    // Añadir marcadores para cada negocio
    businesses.forEach(business => {
        const marker = L.marker([business.lat, business.lng])
            .addTo(map)
            .bindPopup(`
                <h3>${business.name}</h3>
                <p><strong>Tipo:</strong> ${getBusinessTypeText(business.type)}</p>
                <p>${business.description}</p>
                <button onclick="showBusinessDetails(${business.id})">Ver Detalles</button>
            `);
        
        marker.businessId = business.id;
        markers.push(marker);
        
        // Evento click en el marcador
        marker.on('click', function() {
            showBusinessDetails(business.id);
        });
    });
}

// Mostrar detalles del negocio en modal
function showBusinessDetails(businessId) {
    const business = businesses.find(b => b.id === businessId);
    if (!business) return;
    
    document.getElementById('modal-business-name').textContent = business.name;
    document.getElementById('modal-business-type').textContent = `Tipo: ${getBusinessTypeText(business.type)}`;
    document.getElementById('modal-business-description').textContent = business.description;
    document.getElementById('modal-business-address').textContent = `Dirección: ${business.address}`;
    document.getElementById('modal-business-phone').textContent = business.phone ? `Teléfono: ${business.phone}` : '';
    
    // Configurar botón de marcado como visitado
    markVisitedBtn.onclick = function() {
        markAsVisited(businessId);
    };
    
    businessModal.style.display = 'block';
}

// Marcar negocio como visitado
function markAsVisited(businessId) {
    if (!visitedPlaces.includes(businessId)) {
        visitedPlaces.push(businessId);
        localStorage.setItem('visitedPlaces', JSON.stringify(visitedPlaces));
        alert('¡Negocio marcado como visitado!');
        businessModal.style.display = 'none';
    } else {
        alert('Ya has visitado este negocio.');
    }
}

// Obtener texto del tipo de negocio
function getBusinessTypeText(type) {
    const types = {
        'restaurante': 'Restaurante',
        'tienda': 'Tienda',
        'servicio': 'Servicio',
        'artesania': 'Artesanía',
        'otro': 'Otro'
    };
    return types[type] || type;
}

// Manejar envío del formulario
businessForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const businessData = {
        id: Date.now(),
        name: document.getElementById('business-name').value,
        type: document.getElementById('business-type').value,
        description: document.getElementById('business-description').value,
        address: document.getElementById('business-address').value,
        phone: document.getElementById('business-phone').value,
        lat: -18.006567 + (Math.random() - 0.5) * 0.02, // Coordenadas aleatorias cerca de Tacna
        lng: -70.246274 + (Math.random() - 0.5) * 0.02
    };
    
    businesses.push(businessData);
    localStorage.setItem('businesses', JSON.stringify(businesses));
    
    // Recargar negocios en el mapa
    loadBusinesses();
    
    // Limpiar formulario
    businessForm.reset();
    
    alert('¡Negocio agregado exitosamente!');
});

// Cerrar modal
closeModal.addEventListener('click', function() {
    businessModal.style.display = 'none';
});

// Cerrar modal al hacer click fuera
window.addEventListener('click', function(e) {
    if (e.target === businessModal) {
        businessModal.style.display = 'none';
    }
});

// Funcionalidad del menú de cuenta
document.getElementById('perfil-link').addEventListener('click', function(e) {
    e.preventDefault();
    alert('Funcionalidad de perfil en desarrollo');
});

document.getElementById('lugares-visitados').addEventListener('click', function(e) {
    e.preventDefault();
    showVisitedPlaces();
});

document.getElementById('cerrar-sesion').addEventListener('click', function(e) {
    e.preventDefault();
    alert('Cerrando sesión...');
});

// Mostrar lugares visitados
function showVisitedPlaces() {
    const visitedBusinesses = businesses.filter(business => 
        visitedPlaces.includes(business.id)
    );
    
    if (visitedBusinesses.length === 0) {
        alert('Aún no has visitado ningún negocio.');
        return;
    }
    
    let message = 'Lugares que has visitado:\n\n';
    visitedBusinesses.forEach(business => {
        message += `• ${business.name} (${getBusinessTypeText(business.type)})\n`;
    });
    
    alert(message);
}

// Geolocalización del usuario
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        // Añadir marcador de ubicación del usuario
        L.marker([userLat, userLng])
            .addTo(map)
            .bindPopup('¡Tu ubicación actual!')
            .openPopup();
    });
}

// Cargar negocios al iniciar
loadBusinesses();
