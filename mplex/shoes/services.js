/**
 * Shoes Multiplexor Services Manager
 *
 * This file provides functionality for managing multiplexor services
 * and integrating them with the UI.
 */

class MultiplexorServices {
    constructor() {
        this.services = [];
        this.loadedServices = false;
    }

    /**
     * Load available services from the services.json file
     * @returns {Promise} Promise that resolves with the services
     */
    async loadServices() {
        if (this.loadedServices) {
            return this.services;
        }

        try {
            const response = await fetch('/multiplexor/api/services');
            const data = await response.json();
            this.services = data.services;
            this.loadedServices = true;
            return this.services;
        } catch (error) {
            console.error('Error loading services:', error);
            return [];
        }
    }

    /**
     * Get a service by its ID
     * @param {string} id Service ID
     * @returns {Object|null} Service object or null if not found
     */
    getServiceById(id) {
        return this.services.find(service => service.id === id) || null;
    }

    /**
     * Get a service by its match pattern
     * @param {string} match Match pattern
     * @returns {Object|null} Service object or null if not found
     */
    getServiceByMatch(match) {
        return this.services.find(service => service.match === match) || null;
    }

    /**
     * Populate a select element with available services
     * @param {HTMLSelectElement} selectElement Select element to populate
     * @param {string} selectedId ID of the service to select (optional)
     */
    populateServiceSelect(selectElement, selectedId = null) {
        selectElement.innerHTML = '<option value="">Выберите сервис...</option>';

        this.services.forEach(service => {
            const option = document.createElement('option');
            option.value = service.id;
            option.textContent = service.name;
            option.dataset.match = service.match;
            option.dataset.forward = service.defaultForward;
            option.dataset.icon = service.icon;

            if (selectedId && service.id === selectedId) {
                option.selected = true;
            }

            selectElement.appendChild(option);
        });
    }

    /**
     * Create a card for each available service
     * @param {HTMLElement} container Container element for the cards
     * @param {Array} activeServices Array of active service IDs
     * @param {Function} onToggle Callback function when a service is toggled
     */
    createServiceCards(container, activeServices = [], onToggle = null) {
        container.innerHTML = '';

        this.services.forEach(service => {
            // Determine if the service is currently active
            const isActive = activeServices.includes(service.id);
            console.debug('Render service card', service.id, 'active:', isActive);

            const card = document.createElement('div');
            card.className = `card ${isActive ? 'bg-primary text-white' : ''}`;
            card.style.cursor = 'pointer';
            // persist state on the element so the handler can read it later
            card.dataset.active = isActive;

            card.innerHTML = `
                <div class="card-body p-3">
                    <div class="d-flex align-items-center">
                        <span class="stamp stamp-md mr-3 ${isActive ? 'bg-white text-primary' : 'bg-primary'}">
                            <i class="${service.icon}"></i>
                        </span>
                        <div>
                            <h4 class="m-0">${service.name}</h4>
                            <small class="${isActive ? 'text-white' : 'text-muted'}">${service.description}</small>
                        </div>
                    </div>
                </div>
            `;

            card.addEventListener('click', () => {
                if (typeof onToggle === 'function') {
                    const nextState = card.dataset.active !== 'true';
                    console.debug('Toggle service', service.id, '->', nextState);
                    onToggle(service, nextState);
                }
            });

            container.appendChild(card);
        });
    }

    /**
     * Convert a rule to a service object
     * @param {Object} rule Rule object with match and forward properties
     * @returns {Object} Service object with additional properties
     */
    ruleToService(rule) {
        const service = this.getServiceByMatch(rule.match);

        if (service) {
            return {
                ...service,
                forward: rule.forward
            };
        }

        // Custom rule
        return {
            id: 'custom',
            name: 'Пользовательское правило',
            description: `${rule.match} → ${rule.forward}`,
            match: rule.match,
            forward: rule.forward,
            icon: 'fe-code'
        };
    }
}

// Create a global instance
window.multiplexorServices = new MultiplexorServices();
