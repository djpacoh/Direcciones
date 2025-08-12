// ==========================================
// APLICACIÓN ORDENAR DIRECCIONES - VERSIÓN LIMPIA
// Interfaz Flotante con Mapa Fullscreen
// ==========================================

// Variables globales
let map;
let currentZones = [];
let zoneMarkers = [];

// Elementos DOM
const elements = {
    readExcel: null,
    processExcel: null,
    cancelProcess: null,
    excelFile: null,
    zoneCount: null,
    maxAddressesPerZone: null,
    minAddressesPerZone: null,
    sortedAddresses: null
};

// ==========================================
// INICIALIZACIÓN DEL MAPA
// ==========================================

function initializeMap() {
    console.log('🗺️ Inicializando mapa...');
    
    try {
        // Crear mapa centrado en España
        map = L.map('map', {
            zoomControl: true,
            attributionControl: false
        }).setView([39.4699, -0.3763], 6);

        // Agregar capa de tiles
        map.tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);

        console.log('✅ Mapa inicializado correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error inicializando mapa:', error);
        return false;
    }
}

// ==========================================
// CONTROLES DE TRANSPARENCIA
// ==========================================

function initializeTransparencyController() {
    const slider = document.getElementById('transparency-slider');
    const valueDisplay = document.getElementById('transparency-value');
    
    if (!slider || !valueDisplay) {
        console.warn('⚠️ Elementos de transparencia no encontrados');
        return false;
    }
    
    // Aplicar transparencia inicial
    updateTransparency(slider.value);
    
    // Evento para cambio de transparencia
    slider.addEventListener('input', function() {
        const value = this.value;
        updateTransparency(value);
        valueDisplay.textContent = value + '%';
    });
    
    console.log('🎭 Controlador de transparencia inicializado');
    return true;
}

function updateTransparency(value) {
    // Convertir el valor del slider (0-100) a opacidad (0.1-1.0)
    const opacity = Math.max(0.1, value / 100);
    
    // Aplicar transparencia a todos los elementos con la clase transparency-target
    const targets = document.querySelectorAll('.transparency-target');
    targets.forEach(target => {
        if (target.id === 'excel-container' || target.id === 'manual-container' || target.id === 'output-container') {
            target.style.background = `rgba(255, 255, 255, ${opacity})`;
        }
    });
    
    console.log(`🎭 Transparencia actualizada: ${value}% (opacidad: ${opacity})`);
}

// ==========================================
// CONTROLES DE PANELES
// ==========================================

function togglePanel(panelId) {
    const panel = document.getElementById(panelId);
    const toggleBtn = panel?.querySelector('.panel-toggle');
    
    if (!panel) return;
    
    if (panel.classList.contains('minimized')) {
        // Restaurar panel
        panel.classList.remove('minimized');
        if (toggleBtn) toggleBtn.textContent = '−';
        console.log(`📖 Panel ${panelId} restaurado`);
    } else {
        // Minimizar panel
        panel.classList.add('minimized');
        if (toggleBtn) toggleBtn.textContent = '+';
        console.log(`📕 Panel ${panelId} minimizado`);
    }
}

function toggleAllPanels() {
    const panels = document.querySelectorAll('.transparency-target');
    const anyVisible = Array.from(panels).some(panel => !panel.classList.contains('minimized'));
    
    panels.forEach(panel => {
        const toggleBtn = panel.querySelector('.panel-toggle');
        if (anyVisible) {
            panel.classList.add('minimized');
            if (toggleBtn) toggleBtn.textContent = '+';
        } else {
            panel.classList.remove('minimized');
            if (toggleBtn) toggleBtn.textContent = '−';
        }
    });
    
    console.log(`🎯 Todos los paneles ${anyVisible ? 'minimizados' : 'restaurados'}`);
}

// ==========================================
// CONTROLES DE NAVEGACIÓN
// ==========================================

function createMapNavigationControls() {
    // Evitar crear controles duplicados
    const existing = document.getElementById('map-navigation');
    if (existing) return;
    
    const navControls = document.createElement('div');
    navControls.id = 'map-navigation';
    navControls.className = 'floating-control';
    navControls.style.cssText = `
        position: fixed;
        top: 200px;
        left: 20px;
        z-index: 1001;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(10px);
        border-radius: 12px;
        padding: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        border: 1px solid rgba(255, 255, 255, 0.2);
        display: flex;
        flex-direction: column;
        gap: 10px;
    `;
    
    navControls.innerHTML = `
        <button onclick="fitAllZonesInMap()" title="Ver todas las zonas" style="
            background: rgba(76, 175, 80, 0.9);
            color: white;
            border: none;
            padding: 10px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.2s ease;
        ">🔍</button>
        <button onclick="toggleAllPanels()" title="Minimizar/Restaurar paneles" style="
            background: rgba(33, 150, 243, 0.9);
            color: white;
            border: none;
            padding: 10px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.2s ease;
        ">📋</button>
        <button onclick="resetMapView()" title="Resetear vista del mapa" style="
            background: rgba(255, 152, 0, 0.9);
            color: white;
            border: none;
            padding: 10px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.2s ease;
        ">🏠</button>
    `;
    
    document.body.appendChild(navControls);
    console.log('🔧 Controles de navegación creados');
}

function resetMapView() {
    if (map) {
        map.setView([39.4699, -0.3763], 6); // Vista de España
        console.log('🏠 Vista del mapa reseteada');
    }
}

function fitAllZonesInMap() {
    if (!map || !currentZones || currentZones.length === 0) {
        console.warn('⚠️ No hay zonas para ajustar la vista');
        resetMapView();
        return;
    }
    
    const allCoords = [];
    currentZones.forEach(zone => {
        zone.addresses?.forEach(addr => {
            if (addr.lat && addr.lng) {
                allCoords.push([addr.lat, addr.lng]);
            }
        });
    });
    
    if (allCoords.length > 0) {
        const group = new L.featureGroup();
        allCoords.forEach(coord => {
            L.marker(coord).addTo(group);
        });
        
        map.fitBounds(group.getBounds().pad(0.1));
        console.log(`🔍 Vista ajustada a ${allCoords.length} direcciones`);
        
        // Limpiar marcadores temporales
        setTimeout(() => {
            group.clearLayers();
        }, 100);
    } else {
        resetMapView();
    }
}

// ==========================================
// INDICADOR DE ZONAS
// ==========================================

function createZoneIndicator(zoneCount) {
    // Remover indicador existente si existe
    const existing = document.getElementById('zone-indicator');
    if (existing) {
        existing.remove();
    }
    
    if (zoneCount > 0) {
        const indicator = document.createElement('div');
        indicator.id = 'zone-indicator';
        indicator.className = 'zone-indicator';
        
        // Información detallada
        let totalAddresses = 0;
        if (currentZones && currentZones.length > 0) {
            totalAddresses = currentZones.reduce((sum, zone) => sum + (zone.addresses?.length || 0), 0);
        }
        
        indicator.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 16px;">📍</span>
                <div style="line-height: 1.2;">
                    <div style="font-weight: bold;">${zoneCount} Zonas Activas</div>
                    ${totalAddresses > 0 ? `<div style="font-size: 11px; opacity: 0.8;">${totalAddresses} direcciones total</div>` : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(indicator);
        
        // Animación de aparición
        indicator.style.transform = 'translateY(-20px)';
        indicator.style.opacity = '0';
        setTimeout(() => {
            indicator.style.transform = 'translateY(0)';
            indicator.style.opacity = '1';
        }, 100);
    }
}

// ==========================================
// FUNCIONES DE PRUEBA
// ==========================================

function testFloatingInterface() {
    console.log('🧪 === PRUEBA DE INTERFAZ FLOTANTE ===');
    
    const elements = {
        map: document.getElementById('map'),
        transparencyController: document.getElementById('transparency-controller'),
        transparencySlider: document.getElementById('transparency-slider'),
        excelContainer: document.getElementById('excel-container'),
        manualContainer: document.getElementById('manual-container'),
        outputContainer: document.getElementById('output-container'),
        mapNavigation: document.getElementById('map-navigation'),
        zoneIndicator: document.getElementById('zone-indicator')
    };
    
    console.log('📋 Estado de elementos:');
    Object.entries(elements).forEach(([key, el]) => {
        const exists = !!el;
        const visible = exists && el.style.display !== 'none';
        console.log(`   - ${key}: ${exists ? '✅' : '❌'} ${exists ? (visible ? '👁️' : '👀') : ''}`);
        
        if (exists && key !== 'zoneIndicator') {
            const styles = window.getComputedStyle(el);
            const position = styles.position;
            const zIndex = styles.zIndex;
            console.log(`     Position: ${position}, Z-Index: ${zIndex}`);
        }
    });
    
    // Probar transparencia
    if (elements.transparencySlider) {
        const currentValue = elements.transparencySlider.value;
        console.log(`🎭 Transparencia actual: ${currentValue}%`);
    }
    
    // Verificar que el mapa sea fullscreen
    if (elements.map) {
        const rect = elements.map.getBoundingClientRect();
        const isFullscreen = rect.width >= window.innerWidth * 0.9 && rect.height >= window.innerHeight * 0.9;
        console.log(`🗺️ Mapa fullscreen: ${isFullscreen ? '✅' : '❌'} (${Math.round(rect.width)}x${Math.round(rect.height)})`);
    }
    
    console.log('✅ Prueba completada');
}

function createSampleZones() {
    console.log('🧪 Creando zonas de muestra...');
    
    currentZones = [
        {
            id: 1,
            addresses: [
                { address: 'Madrid, España', lat: 40.4168, lng: -3.7038 },
                { address: 'Barcelona, España', lat: 41.3851, lng: 2.1734 }
            ]
        },
        {
            id: 2,
            addresses: [
                { address: 'Valencia, España', lat: 39.4699, lng: -0.3763 },
                { address: 'Sevilla, España', lat: 37.3886, lng: -5.9823 }
            ]
        }
    ];
    
    // Mostrar zonas en el mapa
    displayZonesOnMap(currentZones);
    
    // Crear indicador
    createZoneIndicator(currentZones.length);
    
    console.log('✅ Zonas de muestra creadas');
}

function displayZonesOnMap(zones) {
    if (!map || !zones) return;
    
    console.log(`🗺️ Mostrando ${zones.length} zonas en el mapa`);
    
    // Limpiar marcadores existentes
    zoneMarkers.forEach(marker => {
        if (marker && marker.remove) marker.remove();
    });
    zoneMarkers = [];
    
    // Colores para las zonas
    const colors = ['#FF0000', '#0000FF', '#00FF00', '#FF00FF', '#FFA500', '#800080', '#00FFFF', '#FFFF00'];
    
    zones.forEach((zone, zoneIndex) => {
        const color = colors[zoneIndex % colors.length];
        
        zone.addresses?.forEach((addr, addrIndex) => {
            if (addr.lat && addr.lng) {
                const marker = L.marker([addr.lat, addr.lng], {
                    icon: L.divIcon({
                        html: `<div style="background: ${color}; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${zone.id}</div>`,
                        className: 'custom-zone-marker',
                        iconSize: [30, 30]
                    })
                }).addTo(map);
                
                marker.bindPopup(`
                    <div style="font-family: Arial, sans-serif; min-width: 200px;">
                        <h4 style="margin: 0 0 8px 0; color: ${color};">Zona ${zone.id}</h4>
                        <p style="margin: 0 0 8px 0; font-size: 12px;"><strong>${addr.address}</strong></p>
                        <p style="margin: 4px 0 0 0; font-size: 10px; color: #666;">
                            📍 ${addr.lat.toFixed(6)}, ${addr.lng.toFixed(6)}
                        </p>
                    </div>
                `);
                
                zoneMarkers.push(marker);
            }
        });
    });
}

// ==========================================
// ATAJOS DE TECLADO
// ==========================================

document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + H: Alternar paneles
    if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        toggleAllPanels();
    }
    
    // Ctrl/Cmd + M: Resetear mapa
    if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        resetMapView();
    }
    
    // Ctrl/Cmd + T: Test interfaz
    if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        testFloatingInterface();
    }
    
    // Ctrl/Cmd + S: Crear zonas de muestra
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        createSampleZones();
    }
});

// ==========================================
// REDIMENSIONADO DE VENTANA
// ==========================================

window.addEventListener('resize', function() {
    if (map) {
        setTimeout(() => {
            map.invalidateSize();
            console.log('📐 Tamaño del mapa ajustado');
        }, 100);
    }
});

// ==========================================
// FUNCIONES GLOBALES
// ==========================================

// Hacer funciones accesibles globalmente
window.togglePanel = togglePanel;
window.toggleAllPanels = toggleAllPanels;
window.resetMapView = resetMapView;
window.fitAllZonesInMap = fitAllZonesInMap;
window.testFloatingInterface = testFloatingInterface;
window.createSampleZones = createSampleZones;

// ==========================================
// INICIALIZACIÓN PRINCIPAL
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 === INICIANDO APLICACIÓN LIMPIA ===');
    
    try {
        // Inicializar mapa
        const mapInitialized = initializeMap();
        if (!mapInitialized) {
            throw new Error('No se pudo inicializar el mapa');
        }
        
        // Inicializar controles de transparencia
        const transparencyInitialized = initializeTransparencyController();
        if (transparencyInitialized) {
            console.log('✅ Controles de transparencia inicializados');
        }
        
        // Crear controles de navegación flotantes
        createMapNavigationControls();
        
        // Inicializar elementos básicos
        elements.readExcel = document.getElementById('read-excel');
        elements.excelFile = document.getElementById('excel-file');
        elements.sortedAddresses = document.getElementById('sorted-addresses');
        
        console.log('🎉 === APLICACIÓN INICIADA EXITOSAMENTE ===');
        console.log('💡 Comandos disponibles:');
        console.log('   - testFloatingInterface() - Verificar interfaz');
        console.log('   - createSampleZones() - Crear zonas de prueba');
        console.log('   - toggleAllPanels() - Minimizar/restaurar paneles');
        console.log('   - resetMapView() - Resetear vista del mapa');
        console.log('');
        console.log('🎹 Atajos de teclado:');
        console.log('   - Ctrl+H: Alternar paneles');
        console.log('   - Ctrl+M: Resetear mapa');
        console.log('   - Ctrl+T: Test interfaz');
        console.log('   - Ctrl+S: Crear zonas de muestra');
        
        // Auto-test después de 1 segundo
        setTimeout(() => {
            testFloatingInterface();
            console.log('🎨 ¡Prueba createSampleZones() para ver el efecto completo!');
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error durante la inicialización:', error);
        alert('❌ Error al inicializar la aplicación: ' + error.message);
    }
});

console.log('📄 Script limpio cargado completamente');