import axios from '../node_modules/axios';
//1
// form fields
const form = document.querySelector('.form-data');
const regionName = document.querySelector('.region-name');
const apiKey = document.querySelector('.api-key');
// results divs
const errors = document.querySelector('.errors');
const loading = document.querySelector('.loading');
const results = document.querySelector('.result-container');
const usage = document.querySelector('.carbon-usage');
const fossilfuel = document.querySelector('.fossil-fuel');
const myregion = document.querySelector('.my-region');
const clearBtn = document.querySelector('.clear-btn');


const calculateColor = async (value)=> {
    let co2Scale = [0 ,150, 600, 750, 800];
    let colors = ['#2AA364', '#F5EB4D', '#9E4229', '#381D02', '#381D02'];

    let closestNum = co2Scale.sort((a,b) => {
        return Math.abs(a-value) - Math.abs(b-value);
    })[0];

    console.log(value + 'is closest to' + closestNum);
    let num = (element) => element > closestNum;
    let scaleIndex = co2Scale.findIndex(num);

    let closestColor = colors[scaleIndex];
     console.log(scaleIndex, closestColor);

    chrome.runtime.sendMessage({
        action: 'updateIcon',
        value: {color: closestColor}
    });
};

//6
//call the API

const displayCarbonUsage = async(apiKey, regionName) => {
    try {
        await axios 
            .get('https://api.co2signal.com/v1/latest', {
                params: {
                    countryCode: regionName,
                },
                headers: {
                    'auth-token': apiKey,
                },
            })
            .then((response) => {
                let CO2 = Math.floor(response.data.data.carbonIntensity);

                calculateColor(CO2);

                loading.style.display='none';
                form.style.display='none';
                myregion.textContent = regionName;
                usage.textContent = 
                        Math.round(response.data.data.carbonIntensity) + 'grams (grams CO2 per kWh)';

                fossilfuel.textContent =
                        response.data.data.fossilFuelPercentage.toFixed(2) + 
                        '% (percentage of fossil fuels used to generate electricity)';
                results.style.display = 'block';
            });
    }catch(error) {
        console.log(error);
        loading.style.display='none';
        results.style.display='none';
        errors.textContent='Sorry, we have no data for the region you have requested.';
    }
};

//5
//set up user's api key and region
const setUpUser= async (apiKey, regionName) => {
    localStorage.setItem('apiKey', apiKey);
    localStorage.setItem('regionName', regionName);
    loading.style.display='block';
    errors.textContent='';
    clearBtn.style.display='block';
    //make initial call
    displayCarbonUsage(apiKey, regionName);
};

//4
// handle form submission
const handleSubmit = async(e) => {
    e.preventDefault();
    setUpUser(apiKey.value, regionName.value);
};

//3 initial checks
const init = async() => {
    //if anything is in local storage pick it up
    const storedApiKey = localStorage.getItem('apiKey');
    const storedRegion = localStorage.getItem('regionName');

    //set icon ro be generic green

    chrome.runtime.sendMessage({
        action: 'updateIcon',
        value: { color:'green',},
    });

    if(storedApiKey === null || storedRegion === null) {
        //if we dont have the keys, show the form
        form.style.display = 'block';
        results.style.display = 'none';
        loading.style.display = 'none';
        clearBtn.style.display = 'none';
        errors.textContent = '';
    } else {
        //if we have both region/apiKey in localStorage, shpw results when they load
        
            results.style.display='none';
            form.style.display = 'none';
            displayCarbonUsage(storedApiKey, storedRegion);
            clearBtn.style.display = 'block';
            
     }
};

const reset= async(e) => {
    e.preventDefault();
    //clear local storage for region only
    localStorage.removeItem('regionName');
    init();
};

//2
// set listeners and start app
form.addEventListener('submit', (e) => handleSubmit(e));
clearBtn.addEventListener('click', (e) => reset(e));

//start up 
init();
