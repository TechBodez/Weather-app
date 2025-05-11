const fetch = require('node-fetch');

const API_KEY = 'FILGAj2jGyaigMVRiXBgkkEudV9zmy9D';
const API_URL = 'https://api.tomorrow.io/v4/weather/forecast';

async function testAPI() {
    console.log('Testing API connection...');
    try {
        const url = `${API_URL}?location=42.3478,-71.0466&apikey=${API_KEY}&units=metric&fields=temperature,temperatureApparent,humidity,windSpeed,pressureSeaLevel,uvIndex,visibility,weatherCode`;
        console.log('Request URL:', url);
        
        const response = await fetch(url);
        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', JSON.stringify(data, null, 2));
        
        if (data.error) {
            console.error('API Error:', data.error);
            return;
        }
        
        // Validate the response structure
        if (!data.data || !data.data.timelines || !data.data.timelines[0]) {
            console.error('Invalid response structure:', data);
            return;
        }
        
        console.log('API test successful!');
        
        // Log the current weather data
        const current = data.data.timelines[0].intervals[0].values;
        console.log('\nCurrent Weather:');
        console.log('Temperature:', current.temperature, '°C');
        console.log('Feels Like:', current.temperatureApparent, '°C');
        console.log('Humidity:', current.humidity, '%');
        console.log('Wind Speed:', current.windSpeed, 'km/h');
        console.log('Pressure:', current.pressureSeaLevel, 'mb');
        console.log('UV Index:', current.uvIndex);
        console.log('Visibility:', current.visibility, 'km');
        console.log('Weather Code:', current.weatherCode);
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', await error.response.text());
        }
    }
}

testAPI(); 