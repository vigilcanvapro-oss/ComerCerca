// Configuración inicial y variables globales
class EmprendeTacna {
    constructor() {
        this.map = null;
        this.businesses = JSON.parse(localStorage.getItem('businesses')) || [];
        this.visitedPlaces = JSON.parse(localStorage.getItem('visitedPlaces')) || [];
        this.markers = [];
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        
        this.init();
    }

    init() {
        this.initializeMap();
        this.loadBusinesses();
        this.setupEventListeners();
        this.updateStatistics();
        this.loadFeaturedBusinesses();
    }

    // Inicialización del mapa
    initializeMap() {
        // Coordenadas centrales de Tacna
        const tacnaCenter = [-18.006567, -70.246274];
        
        this.map = L.map('map').setView(tacnaCenter, 14);

        // Capa base de OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(this.map);

        // Capa satelital opcional
        L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        });

        // Inicializar mapa para selección de ubicación
        this.initializeLocationPicker();
    }

    initializeLocationPicker() {
        const pickerMap = L.map('picker-map').setView([-18.006567, -70.246274], 14);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(pickerMap);

        // Marcador arrastrable para selección de ubicación
        const marker = L.marker(pickerMap.getCenter(), {draggable: true}).addTo(pickerMap);
        
        marker.on('dragend', function(event) {
            const marker = event.target;
            const position = marker.getLatLng();
            console.log('Ubicación seleccionada:', position);
        });
    }

    // Cargar negocios en el mapa
    loadBusinesses() {
        // Limpiar marcadores existentes
        this.clearMarkers();

        // Añadir marcadores para cada negocio
        this.businesses.forEach(business => {
            this.addBusinessToMap(business);
        });
    }

    addBusinessToMap(business) {
        const icon = this.getBusinessIcon(business.type);
        
        const marker = L.marker([business.lat, business.lng], {icon: icon})
            .addTo(this.map)
            .bindPopup(this.createBusinessPopup(business));
        
        marker.businessId = business.id;
        this.markers.push(marker);

        // Evento click en el marcador
        marker.on('click', () => {
            this.showBusinessDetails(business.id);
        });
    }

    getBusinessIcon(type) {
        const iconColors = {
            'restaurante': 'red',
            'cafe': 'orange',
            'tienda': 'blue',
            'artesania': 'green',
            'servicio': 'purple',
            'salud': 'pink',
            'educacion': 'darkblue',
            'otros': 'gray'
        };

        return L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color: ${iconColors[type] || 'gray'}" class="marker-pin"></div>`,
            iconSize: [30, 42],
            iconAnchor: [15, 42]
        });
    }

    createBusinessPopup(business) {
        return `
            <div class="business-popup">
                <h4>${business.name}</h4>
                <p><strong>${this.getBusinessTypeText(business.type)}</strong></p>
                <p>${business.description.substring(0, 100)}...</p>
                <button onclick="app.showBusinessDetails(${business.id})" class="btn-primary">
                    Ver Detalles
                </button>
            </div>
        `;
    }

    getBusinessTypeText(type) {
        const types = {
            'restaurante': '🍽️ Restaurante',
            'cafe': '☕ Cafetería',
            'tienda': '🛍️ Tienda',
            'artesania': '🎨 Artesanía',
            'servicio': '🔧 Servicios',
            'salud': '💊 Salud',
            'educacion': '📚 Educación',
            'otros': '🔷 Otros'
        };
        return types[type] || type;
    }

    clearMarkers() {
        this.markers.forEach(marker => this.map.removeLayer(marker));
        this.markers = [];
    }

    // Mostrar detalles del negocio en modal
    showBusinessDetails(businessId) {
        const business = this.businesses.find(b => b.id === businessId);
        if (!business) return;

        // Actualizar contenido del modal
        document.getElementById('modal-business-name').textContent = business.name;
        document.getElementById('modal-business-type').textContent = this.getBusinessTypeText(business.type);
        document.getElementById('modal-business-description').textContent = business.description;
        document.getElementById('modal-business-address').textContent = business.address;
        document.getElementById('modal-business-phone').textContent = business.phone || 'No disponible';
        document.getElementById('modal-business-hours').textContent = business.hours || 'Horario no especificado';

        // Configurar botones de acción
        document.getElementById('mark-visited').onclick = () => this.markAsVisited(businessId);
        document.getElementById('get-directions').onclick = () => this.getDirections(business);

        // Mostrar modal
        this.showModal('business-modal');
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.style.display = 'block';

        // Cerrar modal al hacer click en la X
        modal.querySelector('.modal-close').onclick = () => {
            modal.style.display = 'none';
        };

        // Cerrar modal al hacer click fuera
        window.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
    }

    // Marcar negocio como visitado
    markAsVisited(businessId) {
        if (!this.visitedPlaces.includes(businessId)) {
            this.visitedPlaces.push(businessId);
            localStorage.setItem('visitedPlaces', JSON.stringify(this.visitedPlaces));
            this.showNotification('¡Negocio marcado como visitado!', 'success');
            this.updateStatistics();
            this.hideModal('business-modal');
        } else {
            this.showNotification('Ya has visitado este negocio.', 'warning');
        }
    }

    // Obtener direcciones
    getDirections(business) {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${business.lat},${business.lng}`;
        window.open(url, '_blank');
    }

    // Gestión del formulario de negocio
    setupEventListeners() {
        // Formulario de negocio
        document.getElementById('business-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleBusinessSubmit();
        });

        // Filtro de categorías
        document.getElementById('business-filter').addEventListener('change', (e) => {
            this.filterBusinessesByCategory(e.target.value);
        });

        // Botón de ubicación
        document.getElementById('locate-me').addEventListener('click', () => {
            this.locateUser();
        });

        // Menú de usuario
        this.setupUserMenu();
    }

    handleBusinessSubmit() {
        const formData = {
            id: Date.now(),
            name: document.getElementById('business-name').value.trim(),
            type: document.getElementById('business-type').value,
            description: document.getElementById('business-description').value.trim(),
            address: document.getElementById('business-address').value.trim(),
            phone: document.getElementById('business-phone').value.trim(),
            hours: document.getElementById('business-hours').value.trim(),
            lat: -18.006567 + (Math.random() - 0.5) * 0.02,
            lng: -70.246274 + (Math.random() - 0.5) * 0.02,
            createdAt: new Date().toISOString(),
            visits: 0,
            rating: 0
        };

        // Validaciones básicas
        if (!this.validateBusinessForm(formData)) {
            return;
        }

        this.businesses.push(formData);
        localStorage.setItem('businesses', JSON.stringify(this.businesses));
        
        this.addBusinessToMap(formData);
        this.updateStatistics();
        this.loadFeaturedBusinesses();
        
        document.getElementById('business-form').reset();
        this.showNotification('¡Negocio registrado exitosamente!', 'success');
    }

    validateBusinessForm(data) {
        if (!data.name || data.name.length < 3) {
            this.showNotification('El nombre del negocio debe tener al menos 3 caracteres.', 'error');
            return false;
        }

        if (!data.type) {
            this.showNotification('Por favor selecciona una categoría para tu negocio.', 'error');
            return false;
        }

        if (!data.description || data.description.length < 10) {
            this.showNotification('La descripción debe tener al menos 10 caracteres.', 'error');
            return false;
        }

        if (!data.address) {
            this.showNotification('Por favor ingresa la dirección de tu negocio.', 'error');
            return false;
        }

        return true;
    }

    // Filtrar negocios por categoría
    filterBusinessesByCategory(category) {
        this.clearMarkers();
        
        if (category === 'all') {
            this.loadBusinesses();
        } else {
            const filteredBusinesses = this.businesses.filter(business => business.type === category);
            filteredBusinesses.forEach(business => this.addBusinessToMap(business));
        }
    }

    // Geolocalización del usuario
    locateUser() {
        if (!navigator.geolocation) {
            this.showNotification('La geolocalización no es soportada por tu navegador.', 'error');
            return;
        }

        this.showNotification('Obteniendo tu ubicación...', 'info');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                
                // Centrar mapa en la ubicación del usuario
                this.map.setView([userLat, userLng], 15);
                
                // Añadir marcador de ubicación del usuario
                L.marker([userLat, userLng])
                    .addTo(this.map)
                    .bindPopup('¡Tu ubicación actual!')
                    .openPopup();
                
                this.showNotification('Ubicación encontrada correctamente.', 'success');
            },
            (error) => {
                let errorMessage = 'Error al obtener la ubicación.';
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Permiso de ubicación denegado.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Información de ubicación no disponible.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Tiempo de espera agotado.';
                        break;
                }
                
                this.showNotification(errorMessage, 'error');
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    }

    // Menú de usuario
    setupUserMenu() {
        document.getElementById('profile-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.showUserProfile();
        });

        document.getElementById('visited-places-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.showVisitedPlaces();
        });

        document.getElementById('my-businesses-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.showMyBusinesses();
        });

        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });
    }

    showUserProfile() {
        this.showNotification('Funcionalidad de perfil en desarrollo.', 'info');
    }

    showVisitedPlaces() {
        const visitedBusinesses = this.businesses.filter(business => 
            this.visitedPlaces.includes(business.id)
        );

        if (visitedBusinesses.length === 0) {
            this.showNotification('Aún no has visitado ningún negocio.', 'info');
            return;
        }

        let message = 'Lugares que has visitado:\n\n';
        visitedBusinesses.forEach(business => {
            message += `• ${business.name} (${this.getBusinessTypeText(business.type)})\n`;
        });

        alert(message);
    }

    showMyBusinesses() {
        this.showNotification('Funcionalidad de mis negocios en desarrollo.', 'info');
    }

    logout() {
        this.showNotification('Cerrando sesión...', 'info');
        // Aquí se implementaría la lógica de cierre de sesión
    }

    // Actualizar estadísticas
    updateStatistics() {
        document.getElementById('businesses-count').textContent = this.businesses.length;
        document.getElementById('visits-count').textContent = this.visitedPlaces.length;
    }

    // Cargar negocios destacados
    loadFeaturedBusinesses() {
        const featuredContainer = document.getElementById('featured-businesses');
        
        // Ordenar negocios por número de visitas (simulado)
        const featured = this.businesses
            .sort((a, b) => (b.visits || 0) - (a.visits || 0))
            .slice(0, 6);

        if (featured.length === 0) {
            featuredContainer.innerHTML = `
                <div class="text-center" style="grid-column: 1 / -1;">
                    <p>No hay negocios registrados todavía. ¡Sé el primero en agregar uno!</p>
                </div>
            `;
            return;
        }

        featuredContainer.innerHTML = featured.map(business => `
            <div class="business-card">
                <div class="business-card-header">
                    <h4>${business.name}</h4>
                    <span class="business-type">${this.getBusinessTypeText(business.type)}</span>
                </div>
                <div class="business-card-body">
                    <p>${business.description.substring(0, 100)}...</p>
                    <div class="business-info">
                        <span><i class="fas fa-map-marker-alt"></i> ${business.address}</span>
                        ${business.hours ? `<span><i class="fas fa-clock"></i> ${business.hours}</span>` : ''}
                    </div>
                </div>
                <div class="business-card-actions">
                    <button onclick="app.showBusinessDetails(${business.id})" class="btn-outline">
                        Ver Detalles
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Utilidades
    showNotification(message, type = 'info') {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;
        
        // Estilos para la notificación
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${this.getNotificationColor(type)};
            color: white;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-lg);
            z-index: 3000;
            display: flex;
            align-items: center;
            gap: 1rem;
            max-width: 400px;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    getNotificationColor(type) {
        const colors = {
            'success': '#27ae60',
            'error': '#e74c3c',
            'warning': '#f39c12',
            'info': '#3498db'
        };
        return colors[type] || '#3498db';
    }

    hideModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }
}

// Estilos CSS adicionales para notificaciones
const notificationStyles = `
@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.notification button {
    background: none;
    border: none;
    color: white;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.marker-pin {
    width: 30px;
    height: 30px;
    border-radius: 50% 50% 50% 0;
    background: var(--primary-color);
    position: absolute;
    transform: rotate(-45deg);
    left: 50%;
    top: 50%;
    margin: -15px 0 0 -15px;
}

.marker-pin::after {
    content: '';
    width: 24px;
    height: 24px;
    margin: 3px 0 0 3px;
    background: #fff;
    position: absolute;
    border-radius: 50%;
}

.business-card {
    background: var(--white);
    border-radius: var(--border-radius);
    padding: 1.5rem;
    box-shadow: var(--shadow);
    transition: var(--transition);
}

.business-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-lg);
}

.business-card-header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: 1rem;
}

.business-card-header h4 {
    color: var(--secondary-color);
    margin: 0;
}

.business-type {
    background: var(--primary-color);
    color: var(--white);
    padding: 0.25rem 0.5rem;
    border-radius: 20px;
    font-size: 0.8rem;
}

.business-card-body {
    margin-bottom: 1.5rem;
}

.business-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 1rem;
    font-size: 0.9rem;
    color: var(--text-light);
}

.business-card-actions {
    display: flex;
    gap: 0.5rem;
}
`;

// Añadir estilos al documento
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new EmprendeTacna();
});

// Manejar errores globales
window.addEventListener('error', (event) => {
    console.error('Error en la aplicación:', event.error);
});
