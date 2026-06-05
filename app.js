function getWeatherEmoji(code, windspeed) {
  if (code === 0) return '☀️ Sunny';
  if ([1, 2, 3].includes(code)) return '⛅ Partly cloudy';
  if ([45, 48].includes(code)) return '🌫️ Fog';
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return '🌧️ Rain';
  if ([56, 57, 66, 67, 71, 73, 75, 77, 85, 86].includes(code)) return '❄️ Snow';
  if ([95, 96, 99].includes(code)) return '⛈️ Storm';
  if (windspeed >= 22) return '🌬️ Windy';
  return '☁️ Cloudy';
}

function showWeather({ temperature, weathercode, windspeed, timezone }) {
  const tempEl = document.getElementById('weather-temp');
  const descEl = document.getElementById('weather-description');
  const statusEl = document.getElementById('weather-status');
  tempEl.textContent = `${Math.round(temperature)}°F`;
  descEl.textContent = getWeatherEmoji(weathercode, windspeed);
  statusEl.textContent = `Wind ${Math.round(windspeed)} mph · ${timezone}`;
}

function showError(message, locationText = 'Unable to determine location.') {
  const descEl = document.getElementById('weather-description');
  const statusEl = document.getElementById('weather-status');
  const locationEl = document.getElementById('weather-location');
  descEl.textContent = 'Weather unavailable';
  statusEl.textContent = message;
  locationEl.textContent = locationText;
}

function fetchWeather(lat, lon, locationText = '') {
  const locationEl = document.getElementById('weather-location');
  locationEl.textContent = locationText || `Latitude ${lat.toFixed(2)}, Longitude ${lon.toFixed(2)}`;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=auto`;
  fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then((data) => {
      if (!data.current_weather) throw new Error('Weather data missing');
      showWeather({
        temperature: data.current_weather.temperature,
        weathercode: data.current_weather.weathercode,
        windspeed: data.current_weather.windspeed,
        timezone: data.timezone || 'Local time',
      });
    })
    .catch((error) => {
      console.error('Weather fetch error:', error);
      showError('Unable to fetch weather from Open-Meteo.', locationText || 'Unable to determine location.');
    });
}

function fetchLocationByIp() {
  const locationEl = document.getElementById('weather-location');
  const statusEl = document.getElementById('weather-status');
  statusEl.textContent = 'Looking up location from IP…';
  fetch('https://ipapi.co/json/')
    .then((response) => {
      if (!response.ok) throw new Error('IP lookup failed');
      return response.json();
    })
    .then((data) => {
      if (!data.latitude || !data.longitude) throw new Error('IP location missing');
      const locationText = data.city && data.region ? `${data.city}, ${data.region}` : `Approximate location`;
      fetchWeather(data.latitude, data.longitude, locationText);
    })
    .catch((error) => {
      console.error('IP lookup error:', error);
      showError('Unable to determine location from IP.');
    });
}

document.addEventListener('DOMContentLoaded', function () {
  if (!navigator.geolocation) {
    showError('Geolocation is not available in this browser.');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      fetchWeather(latitude, longitude, 'Your location');
    },
    (error) => {
      if (error.code === error.PERMISSION_DENIED) {
        showError('Enable location to see your weather.', 'Location access denied.');
      } else {
        showError('Unable to retrieve location.', 'Location retrieval failed.');
      }
      fetchLocationByIp();
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
  );
});
