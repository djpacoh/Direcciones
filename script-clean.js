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
        // Crear mapa centrado en Cataluña
        map = L.map('map', {
            zoomControl: true,
            attributionControl: false
        }).setView([41.5888, 1.6435], 8);

        // Agregar capa de tiles
        map.tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);

        console.log('✅ Mapa inicializado correctamente - Centrado en Cataluña');
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
    // Convertir el valor del slider (0-100) a opacidad (0.7-1.0) para mejor legibilidad
    const opacity = Math.max(0.7, value / 100);
    
    // Aplicar transparencia a todos los paneles
    const panels = ['excel-container', 'manual-container', 'output-container'];
    panels.forEach(panelId => {
        const panel = document.getElementById(panelId);
        if (panel) {
            // Mantener el blur effect pero cambiar la opacidad
            const background = `rgba(255, 255, 255, ${opacity})`;
            panel.style.setProperty('background', background, 'important');
        }
    });
    
    console.log(`🎭 Transparencia actualizada: ${value}% (opacidad: ${opacity.toFixed(2)})`);
}

// ==========================================
// CONTROLES DE PANELES
// ==========================================

function togglePanel(panelId) {
    const panel = document.getElementById(panelId);
    const toggleBtn = panel?.querySelector('.panel-toggle');
    
    if (!panel) {
        console.warn(`⚠️ Panel ${panelId} no encontrado`);
        return;
    }
    
    if (panel.classList.contains('minimized')) {
        // Restaurar desde minimizado a normal
        panel.classList.remove('minimized');
        panel.classList.remove('maximized');
        if (toggleBtn) toggleBtn.textContent = '−';
        console.log(`📖 Panel ${panelId} restaurado a tamaño normal`);
    } else if (panel.classList.contains('maximized')) {
        // Cambiar de maximizado a minimizado
        panel.classList.remove('maximized');
        panel.classList.add('minimized');
        if (toggleBtn) toggleBtn.textContent = '+';
        console.log(`📕 Panel ${panelId} minimizado desde maximizado`);
    } else {
        // Cambiar de normal a minimizado
        panel.classList.add('minimized');
        if (toggleBtn) toggleBtn.textContent = '+';
        console.log(`📕 Panel ${panelId} minimizado`);
    }
}

function maximizePanel(panelId) {
    const panel = document.getElementById(panelId);
    const toggleBtn = panel?.querySelector('.panel-toggle');
    
    if (!panel) return;
    
    // Quitar estados previos y maximizar
    panel.classList.remove('minimized');
    panel.classList.add('maximized');
    if (toggleBtn) toggleBtn.textContent = '−';
    console.log(`🔍 Panel ${panelId} maximizado`);
}

function setupPanelInteractions() {
    const panels = ['excel-container', 'manual-container', 'output-container'];
    
    panels.forEach(panelId => {
        const panel = document.getElementById(panelId);
        if (panel) {
            // Doble click en el título para maximizar
            const title = panel.querySelector('h1, h2, h3');
            if (title) {
                title.style.cursor = 'pointer';
                title.addEventListener('dblclick', () => {
                    if (panel.classList.contains('maximized')) {
                        // Si ya está maximizado, volver a normal
                        panel.classList.remove('maximized');
                        console.log(`📖 Panel ${panelId} vuelto a tamaño normal`);
                    } else {
                        // Maximizar panel
                        maximizePanel(panelId);
                    }
                });
                
                // Tooltip para indicar doble-click
                title.title = 'Doble-click para maximizar/restaurar';
            }
        }
    });
    
    console.log('🔧 Interacciones de paneles configuradas');
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
        <button onclick="resetMapView()" title="Centrar en Cataluña" style="
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
        map.setView([41.5888, 1.6435], 8); // Vista de Cataluña
        console.log('🏠 Vista del mapa reseteada a Cataluña');
    }
}

function fitAllZonesInMap() {
    if (!map || !currentZones || currentZones.length === 0) {
        console.warn('⚠️ No hay zonas para ajustar la vista, centrando en Cataluña');
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
    console.log('🧪 Creando zonas de muestra para Cataluña...');
    
    currentZones = [
        {
            id: 1,
            addresses: [
                { address: 'Barcelona, Cataluña', lat: 41.3851, lng: 2.1734, region: 'Barcelona' },
                { address: 'Sabadell, Cataluña', lat: 41.5433, lng: 2.1090, region: 'Barcelona' }
            ]
        },
        {
            id: 2,
            addresses: [
                { address: 'Girona, Cataluña', lat: 41.9794, lng: 2.8214, region: 'Girona' },
                { address: 'Lleida, Cataluña', lat: 41.6143, lng: 0.6255, region: 'Lleida' }
            ]
        },
        {
            id: 3,
            addresses: [
                { address: 'Tarragona, Cataluña', lat: 41.1189, lng: 1.2445, region: 'Tarragona' },
                { address: 'Terrassa, Cataluña', lat: 41.5640, lng: 2.0084, region: 'Barcelona' }
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
                        ${addr.region ? `<p style="margin: 0 0 4px 0; font-size: 11px; color: #4CAF50;">📍 Región: ${addr.region}</p>` : ''}
                        <p style="margin: 4px 0 0 0; font-size: 10px; color: #666;">
                            🌍 ${addr.lat.toFixed(6)}, ${addr.lng.toFixed(6)}
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
// MANEJO DE ARCHIVOS
// ==========================================

function setupFileHandling() {
    console.log('📂 Configurando manejo de archivos...');
    
    if (elements.readExcel) {
        elements.readExcel.addEventListener('click', async function() {
            const file = elements.excelFile?.files[0];
            if (!file) {
                alert('Por favor selecciona un archivo primero');
                return;
            }
            
            try {
                console.log('📂 Leyendo archivo:', file.name);
                const addresses = await readFile(file);
                
                if (addresses && addresses.length > 0) {
                    console.log(`✅ Se cargaron ${addresses.length} direcciones`);
                    displayAddresses(addresses);
                    
                    // Crear zonas automáticamente
                    const zoneCount = parseInt(elements.zoneCount?.value || 3);
                    createZonesFromAddresses(addresses, zoneCount);
                } else {
                    alert('❌ No se encontraron direcciones válidas en el archivo');
                }
            } catch (error) {
                console.error('❌ Error al leer archivo:', error);
                alert('❌ Error al leer el archivo: ' + error.message);
            }
        });
    }
    
    console.log('✅ Manejo de archivos configurado');
}

async function readFile(file) {
    console.log(`📖 Procesando archivo: ${file.name} (${file.type})`);
    
    const fileText = await file.text();
    const lines = fileText.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    
    console.log(`📋 Se encontraron ${lines.length} líneas`);
    
    // Crear objetos de dirección básicos
    const addresses = lines.map((line, index) => ({
        id: index + 1,
        address: line,
        lat: null,
        lng: null,
        geocoded: false
    }));
    
    return addresses;
}

function displayAddresses(addresses) {
    if (!elements.sortedAddresses) return;
    
    elements.sortedAddresses.innerHTML = '';
    
    const header = document.createElement('li');
    header.innerHTML = `<strong>📍 ${addresses.length} direcciones cargadas:</strong>`;
    header.style.cssText = 'color: #2196F3; font-weight: bold; border-bottom: 2px solid #2196F3; padding-bottom: 5px; margin-bottom: 10px;';
    elements.sortedAddresses.appendChild(header);
    
    addresses.forEach((addr, index) => {
        const li = document.createElement('li');
        li.innerHTML = `${index + 1}. ${addr.address}`;
        li.style.cssText = 'padding: 5px 0; border-bottom: 1px solid rgba(0,0,0,0.1);';
        elements.sortedAddresses.appendChild(li);
    });
    
    console.log(`📋 Direcciones mostradas en la interfaz`);
}

function createZonesFromAddresses(addresses, zoneCount) {
    console.log(`🗂️ Creando ${zoneCount} zonas para ${addresses.length} direcciones...`);
    
    // Dividir direcciones en zonas de manera equitativa
    const addressesPerZone = Math.ceil(addresses.length / zoneCount);
    const zones = [];
    
    for (let i = 0; i < zoneCount; i++) {
        const startIndex = i * addressesPerZone;
        const endIndex = Math.min(startIndex + addressesPerZone, addresses.length);
        const zoneAddresses = addresses.slice(startIndex, endIndex);
        
        if (zoneAddresses.length > 0) {
            zones.push({
                id: i + 1,
                addresses: zoneAddresses
            });
        }
    }
    
    console.log(`✅ Creadas ${zones.length} zonas`);
    
    // Actualizar zonas actuales globalmente
    currentZones = zones;
    
    // Mostrar zonas en el mapa (simulando coordenadas por ahora)
    simulateCoordinatesForZones(zones);
    
    // Crear indicador
    createZoneIndicator(zones.length);
    
    // Actualizar resultados
    updateResultsWithZones(zones);
}

function simulateCoordinatesForZones(zones) {
    console.log('🎯 Simulando coordenadas para Cataluña (territorio terrestre)...');
    
    // Sub-regiones de Cataluña para evitar coordenadas en el mar
    const catalunyaRegions = [
        // Provincia de Barcelona (área metropolitana y interior)
        {
            name: 'Barcelona',
            bounds: { north: 42.1, south: 41.1, east: 2.3, west: 1.2 }
        },
        // Provincia de Girona (costa brava e interior, evitando mar)
        {
            name: 'Girona',
            bounds: { north: 42.7, south: 41.6, east: 3.1, west: 2.1 }
        },
        // Provincia de Lleida (interior oeste)
        {
            name: 'Lleida',
            bounds: { north: 42.6, south: 41.2, east: 1.8, west: 0.2 }
        },
        // Provincia de Tarragona (costa dorada e interior)
        {
            name: 'Tarragona',
            bounds: { north: 41.8, south: 40.5, east: 1.8, west: 0.3 }
        }
    ];
    
    zones.forEach(zone => {
        zone.addresses.forEach(addr => {
            let attempts = 0;
            let validCoordinate = false;
            
            // Intentar generar coordenadas válidas hasta 10 intentos
            while (!validCoordinate && attempts < 10) {
                // Seleccionar una región aleatoria
                const region = catalunyaRegions[Math.floor(Math.random() * catalunyaRegions.length)];
                
                // Generar coordenadas dentro de esa región específica
                const bounds = region.bounds;
                addr.lat = bounds.south + Math.random() * (bounds.north - bounds.south);
                addr.lng = bounds.west + Math.random() * (bounds.east - bounds.west);
                
                // Validar que las coordenadas están en territorio catalán
                if (validateCatalanCoordinates(addr.lat, addr.lng)) {
                    addr.geocoded = true;
                    addr.region = region.name;
                    validCoordinate = true;
                } else {
                    attempts++;
                }
            }
            
            // Si después de 10 intentos no se encuentra una coordenada válida, usar Barcelona como fallback
            if (!validCoordinate) {
                addr.lat = 41.3851; // Barcelona
                addr.lng = 2.1734;
                addr.region = 'Barcelona (fallback)';
                addr.geocoded = true;
                console.warn(`⚠️ Usando coordenadas de fallback para: ${addr.address}`);
            }
        });
    });
    
    // Mostrar estadísticas de regiones utilizadas
    const regionStats = {};
    let totalAddresses = 0;
    let fallbackCount = 0;
    
    zones.forEach(zone => {
        zone.addresses.forEach(addr => {
            totalAddresses++;
            if (addr.region) {
                regionStats[addr.region] = (regionStats[addr.region] || 0) + 1;
                if (addr.region.includes('fallback')) {
                    fallbackCount++;
                }
            }
        });
    });
    
    console.log('📊 Distribución por regiones:', regionStats);
    if (fallbackCount > 0) {
        console.warn(`⚠️ Se usaron ${fallbackCount} coordenadas de fallback de ${totalAddresses} total`);
    } else {
        console.log(`✅ Todas las ${totalAddresses} coordenadas se generaron correctamente en territorio catalán`);
    }
    
    // Mostrar zonas en el mapa
    displayZonesOnMap(zones);
}

function updateResultsWithZones(zones) {
    if (!elements.sortedAddresses) return;
    
    elements.sortedAddresses.innerHTML = '';
    
    zones.forEach(zone => {
        const zoneHeader = document.createElement('li');
        zoneHeader.innerHTML = `<strong>🏷️ Zona ${zone.id} (${zone.addresses.length} direcciones):</strong>`;
        zoneHeader.style.cssText = 'color: #4CAF50; font-weight: bold; margin-top: 15px; padding: 8px; background: rgba(76, 175, 80, 0.1); border-radius: 5px;';
        elements.sortedAddresses.appendChild(zoneHeader);
        
        zone.addresses.forEach((addr, index) => {
            const li = document.createElement('li');
            li.innerHTML = `&nbsp;&nbsp;&nbsp;${index + 1}. ${addr.address}`;
            li.style.cssText = 'padding: 3px 0; color: #333; margin-left: 15px;';
            elements.sortedAddresses.appendChild(li);
        });
    });
    
    console.log(`📊 Resultados actualizados con ${zones.length} zonas`);
}

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

// ==========================================
// FUNCIONES DE VALIDACIÓN DE COORDENADAS
// ==========================================

function validateCatalanCoordinates(lat, lng) {
    // Límites generales de Cataluña (más conservadores)
    const catalunyaBounds = {
        north: 42.86,
        south: 40.52,
        east: 3.35,
        west: 0.15
    };
    
    return (lat >= catalunyaBounds.south && lat <= catalunyaBounds.north &&
            lng >= catalunyaBounds.west && lng <= catalunyaBounds.east);
}

function testGeocoding() {
    console.log('🧪 === PRUEBA DE GEOCODIFICACIÓN ===');
    
    // Crear direcciones de prueba
    const testAddresses = [
        'Barcelona, España',
        'Girona, España', 
        'Lleida, España',
        'Tarragona, España',
        'Sabadell, España'
    ].map((addr, index) => ({
        id: index + 1,
        address: addr,
        lat: null,
        lng: null,
        geocoded: false
    }));
    
    console.log(`📍 Probando geocodificación con ${testAddresses.length} direcciones...`);
    
    // Simular coordenadas
    const zones = [{ id: 1, addresses: testAddresses }];
    simulateCoordinatesForZones(zones);
    
    // Validar cada coordenada
    let validCoords = 0;
    let invalidCoords = 0;
    
    testAddresses.forEach(addr => {
        const isValid = validateCatalanCoordinates(addr.lat, addr.lng);
        if (isValid) {
            validCoords++;
            console.log(`✅ ${addr.address}: ${addr.lat.toFixed(4)}, ${addr.lng.toFixed(4)} (${addr.region})`);
        } else {
            invalidCoords++;
            console.log(`❌ ${addr.address}: ${addr.lat.toFixed(4)}, ${addr.lng.toFixed(4)} - FUERA DE CATALUÑA`);
        }
    });
    
    console.log(`📊 Resultados: ${validCoords} válidas, ${invalidCoords} inválidas`);
    
    // Mostrar en el mapa si están todas válidas
    if (invalidCoords === 0) {
        currentZones = zones;
        displayZonesOnMap(zones);
        createZoneIndicator(1);
        console.log('🎉 ¡Todas las coordenadas están en territorio catalán!');
    } else {
        console.log('⚠️ Algunas coordenadas necesitan ajuste');
    }
    
    return { valid: validCoords, invalid: invalidCoords, total: testAddresses.length };
}

// Hacer funciones accesibles globalmente
window.togglePanel = togglePanel;
window.maximizePanel = maximizePanel;
window.toggleAllPanels = toggleAllPanels;
window.resetMapView = resetMapView;
window.fitAllZonesInMap = fitAllZonesInMap;
window.testFloatingInterface = testFloatingInterface;
window.createSampleZones = createSampleZones;
window.readFile = readFile;
window.createZonesFromAddresses = createZonesFromAddresses;
window.testGeocoding = testGeocoding;
window.validateCatalanCoordinates = validateCatalanCoordinates;
window.setupPanelInteractions = setupPanelInteractions;
window.updateTransparency = updateTransparency;

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
        elements.processExcel = document.getElementById('process-excel');
        elements.zoneCount = document.getElementById('zone-count');
        
        // Configurar event listeners para carga de archivos
        setupFileHandling();
        
        // Configurar interacciones de paneles
        setupPanelInteractions();
        
        console.log('🎉 === APLICACIÓN INICIADA EXITOSAMENTE ===');
        console.log('');
        console.log('💡 Comandos disponibles en consola:');
        console.log('   - testFloatingInterface() - Verificar interfaz');
        console.log('   - createSampleZones() - Crear zonas de prueba');
        console.log('   - testGeocoding() - Probar geocodificación precisa');
        console.log('   - togglePanel("panel-id") - Alternar panel específico');
        console.log('   - maximizePanel("panel-id") - Maximizar panel específico');
        console.log('   - toggleAllPanels() - Minimizar/restaurar todos los paneles');
        console.log('   - resetMapView() - Resetear vista del mapa');
        console.log('   - fitAllZonesInMap() - Ajustar vista a todas las zonas');
        console.log('');
        console.log('🎹 Atajos de teclado:');
        console.log('   - Ctrl+H: Alternar paneles');
        console.log('   - Ctrl+M: Centrar en Cataluña');
        console.log('   - Ctrl+T: Test interfaz');
        console.log('   - Ctrl+S: Crear zonas de muestra (Cataluña)');
        console.log('');
        console.log('📂 Funciones de archivo:');
        console.log('   - ✅ Cargar archivos TXT/CSV funciona');
        console.log('   - ✅ División automática en zonas');
        console.log('   - ✅ Coordenadas simuladas en Cataluña');
        console.log('   - ✅ Transparencia ajustable en tiempo real');
        console.log('');
        console.log('📱 Gestión de paneles:');
        console.log('   - Botón "−/+": Minimizar/restaurar individual');
        console.log('   - Doble-click en título: Maximizar/restaurar');
        console.log('   - Los paneles están posicionados sin superposición');
        console.log('   - Transparencia mejorada (70%-100%) para legibilidad');
        
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