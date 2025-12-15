// --- Configuration ---
const API_URL = "http://20.74.80.75:8000/latest";
const PM2_5_FIELD = "pm2_5"; 

// Define ranges and advice for PM2.5 (US EPA standards for simplicity)
const MAX_GAUGE_VALUE = 100; // ug/m3. Used for scaling the gauge from 0% to 100%

const PM2_5_THRESHOLDS = [
    // Max value is the upper bound of the range
    { max: 12.0, level: 'Good', color: '#00e400', textColor: 'white', advice: "Air conditions are good. No action required." },
    { max: 35.4, level: 'Moderate', color: '#ffff00', textColor: 'black', advice: "Air quality is acceptable. Consider opening windows for ventilation." },
    { max: 55.4, level: 'Unhealthy for Sensitive Groups', color: '#ff7e00', textColor: 'white', advice: "Ventilate the room to improve air quality. Sensitive individuals should limit prolonged outdoor exertion." },
    { max: Infinity, level: 'Hazardous', color: '#8f3f97', textColor: 'white', advice: "Avoid staying long, air seriously polluted! Keep windows closed and run an air purifier if available." }
];

// Thresholds for other factors (ADJUSTED FOR YOUR RANGES)
const OTHER_THRESHOLDS = {
    // Temperature (Celsius)
    temperature: [
        { min: 25.0, advice: "Open windows or reduce heating to cool the room." },
        { max: 18.0, advice: "Increase heating to maintain comfort." }
    ],
    // Humidity (%)
    humidity: [
        { min: 60.0, advice: "Use a dehumidifier or ventilate to reduce moisture." },
        { max: 30.0, advice: "Consider using a humidifier." }
    ],
    // CO2 (ppm) - High concentration suggests poor ventilation
    co2: [
        { min: 1400, advice: "CO2 is very high. Immediate and prolonged ventilation is highly recommended." }, // Triggered between 1400 and 1600
        { min: 1000, advice: "CO2 is high. Ventilate the room (open windows) to improve air quality." } // Triggered between 1000 and 1400
        // NOTE: Order matters for min checks: highest min should be first.
    ],
    // VOC Index (generic scale, typically 1.0 is baseline)
    voc_index: [
        { min: 5.0, advice: "Critical VOC Index detected! Seek immediate ventilation to disperse potential chemical pollutants." }, // NEW CRITICAL LEVEL
        { min: 2.0, advice: "High VOC Index detected. Ensure good ventilation to disperse volatile organic compounds." } // Elevated level
    ]
};

// Helper function to format data items for display AND for the info tab
const DATA_CONFIG = {
    temperature: { label: "Temperature", unit: "°C", icon: "fas fa-thermometer-half", meaning: "Comfort and health, ideal range is 18°C - 25°C." },
    humidity: { label: "Humidity", unit: "%", icon: "fas fa-tint", meaning: "Moisture content in air, ideal is 30% - 60%. Too high risks mold; too low risks irritation." },
    pm2_5: { label: "PM2.5", unit: "µg/m³", icon: "fas fa-smog", meaning: "Fine particulate matter, the primary pollutant determining air quality index." },
    co2: { label: "CO2", unit: "ppm", icon: "fas fa-cloud", meaning: "Carbon Dioxide. High levels (>1000 ppm) indicate poor ventilation." },
    voc_index: { label: "VOC Index", unit: "", icon: "fas fa-wind", meaning: "Volatile Organic Compounds (solvents, cleaners, etc.). Index > 2.0 is elevated." },
    device_id: { label: "Device ID", unit: "", icon: "fas fa-microchip", meaning: "Identifier of the sensor unit." }
};


// --- Core Functions ---

// 1. Fetch Data from API
async function fetchData() {
    const loadingElement = document.getElementById('loading');
    const dataFieldsElement = document.getElementById('data-fields');
    const refreshButton = document.getElementById('refresh-button');

    // Show loading state and disable button
    loadingElement.classList.remove('hidden');
    dataFieldsElement.classList.add('hidden');
    refreshButton.disabled = true;

    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`); 
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Data successfully fetched:", data); 

        updateUI(data); // Process and display the data
        
    } catch (error) {
        console.error("Could not fetch data:", error);
        loadingElement.textContent = `Error fetching data: ${error.message}. Please check the browser console for details.`;
        loadingElement.style.color = 'red';
    } finally {
        // Hide loading state and re-enable button
        loadingElement.classList.add('hidden');
        dataFieldsElement.classList.remove('hidden');
        refreshButton.disabled = false;
    }
}

// 2. Update the User Interface
function updateUI(data) {
    let currentData = data; 
    
    // 1. Handle array wrapper
    if (Array.isArray(data) && data.length > 0) {
        currentData = data[0]; 
    }

    // 2. Handle the nested JSON string in the 'value' field (The confirmed fix)
    if (currentData.value && typeof currentData.value === 'string') {
        try {
            currentData = JSON.parse(currentData.value);
            console.log("Parsed sensor data:", currentData); 
        } catch (e) {
            console.error("Failed to parse JSON string in 'value' field:", e);
            return;
        }
    }
    
    // Safety check
    if (typeof currentData !== 'object' || currentData === null) {
         console.error("Invalid data object received after processing.");
         return; 
    }

    displayData(currentData); 
    displayInfo(); 

    
    if (currentData[PM2_5_FIELD] !== undefined) {
        const pm25Value = currentData[PM2_5_FIELD];
        const { level, color, textColor, advice } = getPm25Level(pm25Value);
        
        updateGauge(pm25Value);
        updateAqiText(level, color, textColor);
        
        const adviceList = generateAdvice(currentData, advice);
        displayAdvice(adviceList);
    } else {
        console.warn("PM2.5 field is missing from data, cannot update gauge/advice.");
    }
}

// 3. Display Raw Data
function displayData(data) {
    const dataFields = document.getElementById('data-fields');
    const timestampElement = document.getElementById('timestamp-utc');
    dataFields.innerHTML = ''; // Clear previous data
    
    // Display all key-value pairs
    for (const key in data) {
        if (key in DATA_CONFIG) {
            const config = DATA_CONFIG[key];
            const value = data[key];
            
            const item = document.createElement('div');
            item.className = 'data-item';
            item.innerHTML = `
                <div class="data-label">
                    <i class="${config.icon}"></i> ${config.label}
                </div>
                <div class="data-value">
                    ${(typeof value === 'number' ? value.toFixed(1) : value)} ${config.unit}
                </div>
            `;
            dataFields.appendChild(item);
        }
    }

    // Format and display the timestamp
    if (data.timestamp_utc) {
        try {
            const date = new Date(data.timestamp_utc);
            const formattedTime = date.toLocaleString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                timeZoneName: 'short'
            });
            timestampElement.textContent = `Last updated: ${formattedTime}`;
        } catch (e) {
             timestampElement.textContent = `Last updated: ${data.timestamp_utc} (Timezone error)`;
        }
    }
}

// 4. Display Information Tab Content
function displayInfo() {
    const infoList = document.getElementById('info-list');
    infoList.innerHTML = '';
    
    // Filter out the device_id which is less informative for the public
    const displayKeys = ['pm2_5', 'co2', 'voc_index', 'temperature', 'humidity']; 
    
    displayKeys.forEach(key => {
        const config = DATA_CONFIG[key];
        if (config) {
            const li = document.createElement('li');
            li.innerHTML = `<span class="info-metric">${config.label} (${config.unit || 'Index'})</span>: ${config.meaning}`;
            infoList.appendChild(li);
        }
    });
}


// 5. Determine PM2.5 Level
function getPm25Level(pm25Value) {
    for (const threshold of PM2_5_THRESHOLDS) {
        if (pm25Value <= threshold.max) {
            return threshold;
        }
    }
    return PM2_5_THRESHOLDS[PM2_5_THRESHOLDS.length - 1]; 
}

// 6. Update the Gauge and Text
function updateGauge(pm25Value) {
    // The slider is shown by PM2.5 value.
    // The total scale goes up to MAX_GAUGE_VALUE (100 ug/m3).

    const needle = document.getElementById('aqi-needle');
    
    // Normalize PM2.5 value against the total visual range (100 ug/m3)
    let percentage = (pm25Value / MAX_GAUGE_VALUE) * 100;

    // Clamp the value: min 0%, max 100%
    percentage = Math.max(0, Math.min(percentage, 100));

    // Ensure the needle doesn't fully disappear (min 1% for visibility if > 0)
    if (percentage < 1 && pm25Value > 0) percentage = 1;

    // Set the needle position
    needle.style.left = `${percentage}%`;
}

function updateAqiText(level, color, textColor) {
    const aqiText = document.getElementById('aqi-level-text');
    aqiText.textContent = `Level: ${level} (${PM2_5_FIELD.toUpperCase()})`;
    aqiText.style.backgroundColor = color;
    aqiText.style.color = textColor;
}


// 7. Generate Contextual Advice
function generateAdvice(data, baseAdvice) {
    const adviceSet = new Set();
    adviceSet.add(baseAdvice); // Start with the primary AQI advice

    // Iterate in reverse to ensure the highest (most critical) min threshold is checked first
    const keys = Object.keys(OTHER_THRESHOLDS);
    for (const key of keys) {
        const value = data[key];
        if (value === undefined) continue;

        // Sort thresholds by 'min' value descending to check highest thresholds first
        const sortedThresholds = OTHER_THRESHOLDS[key].slice().sort((a, b) => (b.min || Infinity) - (a.min || Infinity));

        for (const threshold of sortedThresholds) {
            if (
                (threshold.min !== undefined && value >= threshold.min) ||
                (threshold.max !== undefined && value <= threshold.max)
            ) {
                // Only add if not already present
                adviceSet.add(threshold.advice);
                
                // If a 'min' threshold is triggered, stop checking lower 'min' thresholds for that key
                // unless we want multiple messages for the same metric (which we do for CO2)
            }
        }
    }

    return Array.from(adviceSet);
}


// 8. Display Advice
function displayAdvice(adviceList) {
    const adviceElement = document.getElementById('advice-list');
    adviceElement.innerHTML = ''; // Clear previous advice

    adviceList.forEach(advice => {
        const li = document.createElement('li');
        li.textContent = advice;
        adviceElement.appendChild(li);
    });
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    const refreshButton = document.getElementById('refresh-button');
    refreshButton.addEventListener('click', fetchData);
    
    // Fetch data immediately on load
    fetchData();
});