// Tomorrow.io API configuration
const apiKey = 'FILGAj2jGyaigMVRiXBgkkEudV9zmy9D';
const apiUrl = 'https://api.tomorrow.io/v4/weather/forecast';

// Sample locations data
const locations = [
    {
        lat: 53,
        lon: -0.12,
        custom_id: "my-id-1"
    },
    {
        lat: 51.52,
        lon: -0.11,
        custom_id: "any-internal-id"
    },
    {
        lat: 33.97,
        lon: -118.17,
        custom_id: "us-zipcode-id-765"
    }
];

// DOM elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const cityElement = document.getElementById('city');
const tempElement = document.getElementById('temp');
const weatherIcon = document.getElementById('weather-icon');
const descriptionElement = document.getElementById('description');
const humidityElement = document.getElementById('humidity');
const windElement = document.getElementById('wind');

// Loading state
let isLoading = false;
let currentLocationIndex = 0;

// Event listeners
searchBtn.addEventListener('click', getWeather);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        getWeather();
    }
});

// Initialize the app
window.addEventListener('load', () => {
    // Load weather for all locations
    loadAllLocations();
});

// Function to load weather for all locations
async function loadAllLocations() {
    setLoading(true);
    try {
        // Fetch weather for each location individually
        for (const location of locations) {
            try {
                const response = await fetch(
                    `${apiUrl}?location=${location.lat},${location.lon}&apikey=${apiKey}&units=metric&fields=temperature,temperatureApparent,humidity,windSpeed,pressureSeaLevel,uvIndex,visibility,weatherCode`
                );
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                // Check for API errors
                if (data.error) {
                    console.error(`Error for location ${location.lat},${location.lon}:`, data.error);
                    showError(`Error fetching weather for location: ${data.error.message}`);
                    continue;
                }
                
                updateWeatherCard(data, location.custom_id);
            } catch (error) {
                console.error(`Error fetching weather for location:`, error);
                showError(`Failed to fetch weather for location. Please try again.`);
            }
        }
    } catch (error) {
        console.error('Error loading locations:', error);
        showError('Error loading weather data for locations');
    } finally {
        setLoading(false);
    }
}

// Function to show loading state
function setLoading(loading) {
    isLoading = loading;
    searchBtn.disabled = loading;
    searchBtn.innerHTML = loading ? 
        '<i class="fas fa-spinner fa-spin"></i>' : 
        '<i class="fas fa-search"></i>';
}

// Function to show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-lg z-50';
    errorDiv.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-exclamation-circle mr-2"></i>
            <p>${message}</p>
        </div>
    `;
    document.body.appendChild(errorDiv);
    
    // Remove error message after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Function to get weather for a single location
async function getWeather() {
    if (isLoading) return;
    
    const city = cityInput.value.trim();
    if (!city) {
        showError('Please enter a city name');
        return;
    }

    setLoading(true);
    try {
        const response = await fetch(
            `${apiUrl}?location=${encodeURIComponent(city)}&apikey=${apiKey}&units=metric&fields=temperature,temperatureApparent,humidity,windSpeed,pressureSeaLevel,uvIndex,visibility,weatherCode`
        );
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check for API errors
        if (data.error) {
            throw new Error(data.error.message);
        }
        
        updateWeatherCard(data, 'custom-search');
    } catch (error) {
        console.error('Error fetching weather:', error);
        showError(error.message || 'City not found. Please try again.');
    } finally {
        setLoading(false);
    }
}

// Function to create alert element
function createAlertElement(alert) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg';
    
    const severity = alert.severity?.toLowerCase() || 'moderate';
    const severityColors = {
        'moderate': 'text-orange-600',
        'severe': 'text-red-600',
        'extreme': 'text-red-700'
    };
    
    alertDiv.innerHTML = `
        <div class="flex items-start">
            <div class="flex-shrink-0">
                <i class="fas fa-exclamation-triangle ${severityColors[severity] || 'text-red-500'}"></i>
            </div>
            <div class="ml-3">
                <h3 class="text-sm font-medium ${severityColors[severity] || 'text-red-500'}">${alert.title || 'Weather Alert'}</h3>
                <div class="mt-2 text-sm text-gray-600">
                    <p>${alert.description || 'No description available'}</p>
                    <p class="mt-1 text-xs text-gray-500">Effective: ${new Date(alert.startTime || Date.now()).toLocaleString()}</p>
                    <p class="text-xs text-gray-500">Expires: ${new Date(alert.endTime || Date.now() + 3600000).toLocaleString()}</p>
                </div>
            </div>
        </div>
    `;
    
    return alertDiv;
}

// Function to update a single weather card
function updateWeatherCard(data, locationId) {
    const cardId = `weather-card-${locationId}`;
    let card = document.getElementById(cardId);
    
    if (!card) {
        card = createWeatherCard(cardId);
    }

    try {
        // Get the current weather data from the hourly timeline
        const current = data.timelines?.hourly?.[0]?.values;
        const location = data.location;
        
        if (!current) {
            throw new Error('Invalid weather data received');
        }
        
        // Update card content
        card.querySelector('.city-name').textContent = getLocationName(location) || 'Unknown Location';
        card.querySelector('.region').textContent = getLocationRegion(location);
        card.querySelector('.temperature').textContent = `${Math.round(current.temperature || 0)}°C`;
        card.querySelector('.feels-like').textContent = `Feels like ${Math.round(current.temperatureApparent || 0)}°C`;
        card.querySelector('.description').textContent = getWeatherDescription(current.weatherCode);
        card.querySelector('.humidity').textContent = `${Math.round(current.humidity || 0)}%`;
        card.querySelector('.wind').textContent = `${Math.round(current.windSpeed || 0)} km/h`;
        card.querySelector('.pressure').textContent = `${Math.round(current.pressureSeaLevel || 0)} mb`;
        card.querySelector('.uv').textContent = Math.round(current.uvIndex || 0);
        card.querySelector('.visibility').textContent = `${Math.round(current.visibility || 0)} km`;
        
        // Update weather icon
        const weatherIcon = card.querySelector('.weather-icon');
        weatherIcon.src = getWeatherIcon(current.weatherCode);
        weatherIcon.alt = getWeatherDescription(current.weatherCode);

        // Add animation to the weather icon
        weatherIcon.style.animation = 'none';
        weatherIcon.offsetHeight; // Trigger reflow
        weatherIcon.style.animation = 'weather-icon-3d 0.5s ease-in-out';

        // Update local time
        const localTime = new Date();
        card.querySelector('.local-time').textContent = localTime.toLocaleString();

        // Add alerts if they exist
        const alertsContainer = card.querySelector('.alerts-container');
        if (data.alerts?.length > 0) {
            alertsContainer.innerHTML = '';
            data.alerts.forEach(alert => {
                alertsContainer.appendChild(createAlertElement(alert));
            });
        } else {
            alertsContainer.innerHTML = '';
        }
    } catch (error) {
        console.error('Error updating weather card:', error);
        showError('Error updating weather information');
    }
}

// Helper function to get location name
function getLocationName(location) {
    if (!location) return 'Unknown Location';
    
    // Try to get location name from reverse geocoding service
    // For now, return coordinates
    return `${location.lat.toFixed(2)}, ${location.lon.toFixed(2)}`;
}

// Helper function to get location region
function getLocationRegion(location) {
    if (!location) return 'Unknown Region';
    
    // Try to get region from reverse geocoding service
    // For now, return coordinates
    return `Lat: ${location.lat.toFixed(2)}, Lon: ${location.lon.toFixed(2)}`;
}

// Function to get weather description based on weather code
function getWeatherDescription(code) {
    const descriptions = {
        '1000': 'Clear',
        '1100': 'Mostly Clear',
        '1101': 'Partly Cloudy',
        '1102': 'Mostly Cloudy',
        '1001': 'Cloudy',
        '2000': 'Fog',
        '2100': 'Light Fog',
        '4000': 'Drizzle',
        '4001': 'Rain',
        '4200': 'Light Rain',
        '4201': 'Heavy Rain',
        '5000': 'Snow',
        '5001': 'Flurries',
        '5100': 'Light Snow',
        '5101': 'Heavy Snow',
        '6000': 'Freezing Drizzle',
        '6001': 'Freezing Rain',
        '6200': 'Light Freezing Rain',
        '6201': 'Heavy Freezing Rain',
        '7000': 'Ice Pellets',
        '7101': 'Heavy Ice Pellets',
        '7102': 'Light Ice Pellets',
        '8000': 'Thunderstorm'
    };
    
    return descriptions[code] || 'Unknown Weather';
}

// Function to get weather icon based on weather code
function getWeatherIcon(code) {
    const iconMap = {
        '1000': 'https://cdn.weatherapi.com/weather/64x64/day/113.png', // Clear
        '1100': 'https://cdn.weatherapi.com/weather/64x64/day/116.png', // Mostly Clear
        '1101': 'https://cdn.weatherapi.com/weather/64x64/day/119.png', // Partly Cloudy
        '1102': 'https://cdn.weatherapi.com/weather/64x64/day/122.png', // Mostly Cloudy
        '1001': 'https://cdn.weatherapi.com/weather/64x64/day/266.png', // Cloudy
        '2000': 'https://cdn.weatherapi.com/weather/64x64/day/296.png', // Fog
        '2100': 'https://cdn.weatherapi.com/weather/64x64/day/248.png', // Light Fog
        '4000': 'https://cdn.weatherapi.com/weather/64x64/day/176.png', // Drizzle
        '4001': 'https://cdn.weatherapi.com/weather/64x64/day/176.png', // Rain
        '4200': 'https://cdn.weatherapi.com/weather/64x64/day/176.png', // Light Rain
        '4201': 'https://cdn.weatherapi.com/weather/64x64/day/176.png', // Heavy Rain
        '5000': 'https://cdn.weatherapi.com/weather/64x64/day/179.png', // Snow
        '5001': 'https://cdn.weatherapi.com/weather/64x64/day/179.png', // Flurries
        '5100': 'https://cdn.weatherapi.com/weather/64x64/day/179.png', // Light Snow
        '5101': 'https://cdn.weatherapi.com/weather/64x64/day/179.png', // Heavy Snow
        '6000': 'https://cdn.weatherapi.com/weather/64x64/day/182.png', // Freezing Drizzle
        '6001': 'https://cdn.weatherapi.com/weather/64x64/day/182.png', // Freezing Rain
        '6200': 'https://cdn.weatherapi.com/weather/64x64/day/182.png', // Light Freezing Rain
        '6201': 'https://cdn.weatherapi.com/weather/64x64/day/182.png', // Heavy Freezing Rain
        '7000': 'https://cdn.weatherapi.com/weather/64x64/day/179.png', // Ice Pellets
        '7101': 'https://cdn.weatherapi.com/weather/64x64/day/179.png', // Heavy Ice Pellets
        '7102': 'https://cdn.weatherapi.com/weather/64x64/day/179.png', // Light Ice Pellets
        '8000': 'https://cdn.weatherapi.com/weather/64x64/day/200.png'  // Thunderstorm
    };
    
    return iconMap[code] || 'https://cdn.weatherapi.com/weather/64x64/day/113.png';
}

// Function to create a weather card
function createWeatherCard(id) {
    const card = document.createElement('div');
    card.id = id;
    card.className = 'bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-6 transform transition-all duration-300 hover:scale-[1.02]';
    
    card.innerHTML = `
        <div class="text-center">
            <h2 class="city-name text-2xl font-bold text-gray-800 mb-1">--</h2>
            <div class="region text-sm text-gray-600 mb-3">--</div>
            
            <div class="relative mb-4">
                <div class="weather-icon-3d inline-block">
                    <img class="weather-icon w-20 h-20 object-contain" src="" alt="weather icon">
                </div>
            </div>
            
            <div class="temperature text-4xl font-bold text-blue-600 mb-1">--</div>
            <div class="feels-like text-sm text-gray-600 mb-2">--</div>
            <div class="description text-lg text-gray-600 mb-4 capitalize">--</div>
            
            <div class="grid grid-cols-2 gap-4 p-3 bg-blue-50 rounded-xl mb-4">
                <div class="flex items-center justify-center gap-2">
                    <i class="fas fa-water text-blue-500 text-lg"></i>
                    <div>
                        <div class="text-sm text-gray-500">Humidity</div>
                        <div class="humidity font-semibold text-gray-700">--%</div>
                    </div>
                </div>
                <div class="flex items-center justify-center gap-2">
                    <i class="fas fa-wind text-blue-500 text-lg"></i>
                    <div>
                        <div class="text-sm text-gray-500">Wind Speed</div>
                        <div class="wind font-semibold text-gray-700">-- km/h</div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-3 gap-2 text-sm mb-4">
                <div class="bg-gray-50 p-2 rounded-lg">
                    <div class="text-gray-500">Pressure</div>
                    <div class="pressure font-semibold">-- mb</div>
                </div>
                <div class="bg-gray-50 p-2 rounded-lg">
                    <div class="text-gray-500">UV Index</div>
                    <div class="uv font-semibold">--</div>
                </div>
                <div class="bg-gray-50 p-2 rounded-lg">
                    <div class="text-gray-500">Visibility</div>
                    <div class="visibility font-semibold">-- km</div>
                </div>
            </div>

            <div class="text-xs text-gray-500 mb-4">
                Local Time: <span class="local-time">--</span>
            </div>

            <div class="alerts-container">
                <!-- Weather alerts will be inserted here -->
            </div>
        </div>
    `;

    // Add the card to the weather cards container
    const weatherCards = document.getElementById('weather-cards');
    weatherCards.appendChild(card);
    
    return card;
}

// Add error handling for API key
if (apiKey === 'FILGAj2jGyaigMVRiXBgkkEudV9zmy9D') {
    showError('Please add your Tomorrow.io API key in the script.js file');
} 