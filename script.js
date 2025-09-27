document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const form = document.getElementById('subnet-form');
    const hostsInput = document.getElementById('hosts');
    const clearBtn = document.getElementById('clear-btn');
    const resultsSection = document.getElementById('results-section');
    const themeToggle = document.getElementById('theme-toggle');
    
    const decimalMaskEl = document.getElementById('decimal-mask');
    const binaryMaskEl = document.getElementById('binary-mask');
    const prefixNotationEl = document.getElementById('prefix-notation');
    const explanationTextEl = document.getElementById('explanation-text');
    const historyContainer = document.getElementById('history-container');
    
    // Historial de cálculos
    let calculationHistory = JSON.parse(localStorage.getItem('subnetCalculations')) || [];
    
    // Inicializar pestañas
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remover clase activa de todas las pestañas
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Agregar clase activa a la pestaña seleccionada
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Cambio de tema
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const isDarkTheme = !document.body.classList.contains('light-theme');
        themeToggle.innerHTML = isDarkTheme ? '☀️' : '🌙';
        localStorage.setItem('darkTheme', isDarkTheme);
    });
    
    // Cargar tema guardado
    if (localStorage.getItem('darkTheme') === 'false') {
        document.body.classList.add('light-theme');
        themeToggle.innerHTML = '🌙';
    }
    
    // Cargar historial
    function loadHistory() {
        if (historyContainer) {
            historyContainer.innerHTML = '';
            
            if (calculationHistory.length === 0) {
                historyContainer.innerHTML = '<p class="text-gray-400 text-center">No hay cálculos guardados</p>';
                return;
            }
            
            calculationHistory.forEach((calc, index) => {
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item';
                historyItem.innerHTML = `
                    <div class="flex justify-between items-center">
                        <span class="font-semibold">${calc.hosts} hosts</span>
                        <span class="text-sm text-gray-400">${new Date(calc.date).toLocaleString()}</span>
                    </div>
                    <div class="text-sm text-emerald-400">${calc.mask} (${calc.prefix})</div>
                `;
                
                historyItem.addEventListener('click', () => {
                    hostsInput.value = calc.hosts;
                    calculateSubnet(calc.hosts);
                });
                
                historyContainer.appendChild(historyItem);
            });
        }
    }
    
    // Función para calcular la subred
    function calculateSubnet(requiredHosts) {
        if (isNaN(requiredHosts) || requiredHosts < 1) {
            alert('Por favor, introduce un número válido de hosts.');
            return;
        }

        // 1. Calcular los bits de host (h)
        // Usamos la fórmula 2^h - 2 >= requiredHosts.
        const hostBits = Math.ceil(Math.log2(requiredHosts + 2));
        const availableHosts = Math.pow(2, hostBits) - 2;

        // 2. Calcular los bits de red (n) y el prefijo
        const networkBits = 32 - hostBits;
        const prefix = `/${networkBits}`;

        // 3. Construir la máscara binaria
        let binaryMaskStr = '1'.repeat(networkBits) + '0'.repeat(hostBits);
        const binaryOctets = [];
        for (let i = 0; i < 32; i += 8) {
            binaryOctets.push(binaryMaskStr.substring(i, i + 8));
        }
        const binaryMaskDisplay = binaryOctets.join('.');

        // 4. Convertir la máscara a decimal
        const decimalOctets = binaryOctets.map(octet => parseInt(octet, 2));
        const decimalMask = decimalOctets.join('.');
        
        // 5. Calcular dirección de red y broadcast
        const networkAddress = calculateNetworkAddress(decimalMask);
        const broadcastAddress = calculateBroadcastAddress(networkAddress, decimalMask);
        const rangeStart = getFirstUsableHost(networkAddress);
        const rangeEnd = getLastUsableHost(broadcastAddress);
        
        // Mostrar resultados
        decimalMaskEl.textContent = decimalMask;
        binaryMaskEl.textContent = binaryMaskDisplay;
        prefixNotationEl.textContent = prefix;
        
        // Mostrar información adicional si existen los elementos
        if (document.getElementById('network-address')) {
            document.getElementById('network-address').textContent = networkAddress;
        }
        if (document.getElementById('broadcast-address')) {
            document.getElementById('broadcast-address').textContent = broadcastAddress;
        }
        if (document.getElementById('host-range')) {
            document.getElementById('host-range').textContent = `${rangeStart} - ${rangeEnd}`;
        }
        if (document.getElementById('available-hosts')) {
            document.getElementById('available-hosts').textContent = availableHosts;
        }

        // Generar y mostrar la explicación
        explanationTextEl.innerHTML = `
            <p>1. Para alojar <strong>${requiredHosts} hosts</strong>, se necesitan <strong>${hostBits} bits</strong> para la porción de host (2<sup>${hostBits}</sup> - 2 = ${availableHosts} hosts disponibles).</p>
            <p>2. De los 32 bits totales, restamos los bits de host: 32 - ${hostBits} = <strong>${networkBits} bits de red</strong>. Esto nos da el prefijo <strong>${prefix}</strong>.</p>
            <p>3. La máscara binaria se forma con ${networkBits} unos ('1') seguidos de ${hostBits} ceros ('0').</p>
            <p>4. Finalmente, cada octeto binario se convierte a su valor decimal para obtener la máscara final.</p>
        `;

        // Guardar en historial
        saveToHistory(requiredHosts, decimalMask, prefix);

        resultsSection.classList.remove('hidden');
        resultsSection.classList.add('fade-in');
    }
    
    // Funciones auxiliares para cálculos adicionales
    function calculateNetworkAddress(subnetMask) {
        // Simplificado para este ejemplo - asumimos 192.168.1.0 como base
        return "192.168.1.0";
    }
    
    function calculateBroadcastAddress(networkAddress, subnetMask) {
        // Simplificado para este ejemplo
        const parts = subnetMask.split('.');
        if (parts[3] === '0') return "192.168.1.255";
        if (parts[3] === '128') return "192.168.1.127";
        if (parts[3] === '192') return "192.168.1.63";
        if (parts[3] === '224') return "192.168.1.31";
        if (parts[3] === '240') return "192.168.1.15";
        if (parts[3] === '248') return "192.168.1.7";
        if (parts[3] === '252') return "192.168.1.3";
        if (parts[3] === '254') return "192.168.1.1";
        return "192.168.1.255";
    }
    
    function getFirstUsableHost(networkAddress) {
        // Simplificado - incrementamos el último octeto en 1
        const parts = networkAddress.split('.');
        parts[3] = parseInt(parts[3]) + 1;
        return parts.join('.');
    }
    
    function getLastUsableHost(broadcastAddress) {
        // Simplificado - decrementamos el último octeto en 1
        const parts = broadcastAddress.split('.');
        parts[3] = parseInt(parts[3]) - 1;
        return parts.join('.');
    }
    
    // Guardar cálculo en historial
    function saveToHistory(hosts, mask, prefix) {
        const calculation = {
            hosts: hosts,
            mask: mask,
            prefix: prefix,
            date: new Date().toISOString()
        };
        
        calculationHistory.unshift(calculation);
        
        // Limitar a 10 entradas
        if (calculationHistory.length > 10) {
            calculationHistory = calculationHistory.slice(0, 10);
        }
        
        localStorage.setItem('subnetCalculations', JSON.stringify(calculationHistory));
        
        // Actualizar la vista del historial
        loadHistory();
    }
    
    // Event Listeners
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const requiredHosts = parseInt(hostsInput.value, 10);
        calculateSubnet(requiredHosts);
    });

    clearBtn.addEventListener('click', () => {
        hostsInput.value = '';
        resultsSection.classList.add('hidden');
        resultsSection.classList.remove('fade-in');
    });
    
    // Inicializar la aplicación
    loadHistory();
});