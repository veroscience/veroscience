

// Add click event listener to toggle-section-icon
$('.toggle-section-icon').click(function() {
    var targetId = $(this).data('target');
    $('#' + targetId).toggle(); // Toggle the visibility of the corresponding section
});


const schoolInfoContent = document.getElementById('school-info-content');

// Make an AJAX request to fetch the organized items
fetch('http://localhost:5000/get-school-info-items')
    .then(response => response.json())
    .then(itemsBySection => {
      //  console.log("itemsBySection", itemsBySection)
        // Iterate through the sections and create lists
        for (const section in itemsBySection) {
            const itemList = document.createElement('ul');
            itemList.classList.add('item-list');

            for (const [k, itemName] of itemsBySection[section].entries()) {
                const item = document.createElement('li');
                item.textContent = itemName;

                // Create and append the placeholder with the specified ID
                const placeholder = document.createElement('div');
                placeholder.id = `${section}_${k}`;                
                placeholder.classList.add('placeholder');


                itemList.appendChild(item);
                itemList.appendChild(placeholder);
            }

            // Append the item list to the corresponding section in school info content
            const section_content = document.querySelector(`#${section}`);
            section_content.appendChild(itemList);
            
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });


/////////////////////////////////////////////
// JavaScript code for filter functionality
const filterSection = document.querySelector('#filter-dropdown-container');
let filterCounter = 0;

 const options = {
            'gender': ['Boys', 'Girls', 'Mixed'],
            'school-type': [
                'State-funded',
                'Independent school',
                'Academy',
                'College',
                'Special school',
                "Service children's education"
            ],
            'school-age': ['Primary', 'Secondary', 'Post 16'],
            'ofsted-score': [
                'Outstanding',
                'Good',
                'Requires improvement',
                'Serious Weaknesses',
                'Inadequate',
                'Special Measures'
            ]
            // Add more options as needed
        };
		
const sectionsVisibility = {
            'primary': 'ks2',
            'secondary': 'ks4',
            'post16': 'ks5',
        };

function createFilterDropdown() {
    const filterDropdown = document.createElement('div');
	var current_filterCounter=filterCounter;

    filterDropdown.classList.add('filter-dropdown');
    filterDropdown.innerHTML = `
        <select class="filter-select" id="filter-select-${current_filterCounter}">
            <option value="gender">Gender</option>
            <option value="school-type">School Type</option>
            <option value="school-age">School Age</option>
            <option value="ofsted-score">Ofsted Score</option>
        </select>
 <i class="fas fa-trash-alt garbage-icon" onclick="deleteFilterDropdown(this, 'filter-select-${current_filterCounter}')"></i> <!-- Font Awesome garbage bin icon -->
        <div class="filter-options" id="filter-options-${current_filterCounter}"></div>
    `;
	
    filterSection.appendChild(filterDropdown);

	createCheckbox(`filter-options-${current_filterCounter}`, options["gender"], "gender");  ///"gender" is the first value so let's the options pop up by default
	
filterDropdown.querySelector('.filter-select').addEventListener('change', function() {
        const selectedValue = this.value; // Get the selected value from the dropdown
		createCheckbox(`filter-options-${current_filterCounter}`, options[selectedValue], selectedValue); // Pass the selected value, options, and filter type to the createCheckbox function
    });

		
    filterCounter++;
}


const filterValues = {};
// Function to create checkboxes for filter options
function createCheckbox(containerId, optionValues, filterType) {

    const container = document.getElementById(containerId);
    // Clear previous checkboxes
    container.innerHTML = '';

    if (optionValues) {
        optionValues.forEach(option => {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = option;
            checkbox.name = filterType;

            const label = document.createElement('label');
		
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(option));

            container.appendChild(label);
			
			     // Add event listener to checkbox to update map markers on change
            checkbox.addEventListener('change', function () {
                // Get all selected checkboxes for this filter type
                const selectedCheckboxes = document.querySelectorAll(`input[type="checkbox"][name="${filterType}"]:checked`);

                // Get the values of the selected checkboxes
                const selectedValues = Array.from(selectedCheckboxes).map(checkbox => checkbox.value);
				
				 filterValues[filterType] = selectedValues;
				 console.log("filterValues", filterValues)
				
				  // Check if selectedValues is empty for the current filter type
				if (selectedValues.length === 0) {
					// Remove the filter type from the filterValues object
					delete filterValues[filterType];
				}

                // Call a function to update map markers based on the selected values
                updateMapMarkers(filterValues);
				
				// Add an event listener for the map's "moveend" event
				// map.on('moveend', function () {
				// 	updateMapMarkers(filterValues);
				// });
				
            });
			
			
			
        });
    }
}

// Function to delete a specific filter-dropdown
function deleteFilterDropdown(icon, dropdownId) {
	const dropdownValue = document.getElementById(dropdownId).value
    const filterDropdown = icon.parentElement;
    filterDropdown.remove();
	
	delete filterValues[dropdownValue];
	updateMapMarkers(filterValues);
}


// Event listener for adding filter dropdowns
// Place the event listener inside DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    // Event listener for adding filter dropdowns
    document.querySelector('.add-filter-btn').addEventListener('click', createFilterDropdown);

    // Add click event listener to School Info icon
    document.getElementById("school-info-icon").addEventListener("click", function () {
        showContent("school-info-content");
    });

    // Add click event listener to Filtering icon
    document.getElementById("filter-icon").addEventListener("click", function () {
        showContent("filtering-content");
    });

});


// Initialize Leaflet map
var map = L.map('map').setView([52.9074, -1.8], 7); // Default to London coordinates


// Add a tile to the map = a background. Comes from OpenStreetmap
L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
    maxZoom: 16,
    }).addTo(map);

// Function to map rating value to a color between green and yellow
function getColor(grade) {
    switch (grade) {
        case 3:
            return 'green';
        case 2:
            return 'yellow'; 
        case 1:
            return 'red';  
        case 0:
            return 'gray'; // Default to gray for unknown ratings
        case -1:
            return 'deepskyblue'; // Default to blue for special school
    }
}


function createCustomClusterMarker(count) {
	var size = Math.log(count) * 15; // Adjust the factor as needed
    return L.divIcon({
        html: '<div><span>' + count + '</span></div>',
            className: 'marker-cluster',
        iconSize:  new L.Point(size, size) // Adjust the size as needed
    });
}

// Create a marker cluster group with custom cluster markers
var allMarkers = L.markerClusterGroup({
    iconCreateFunction: function (cluster) {
          var childMarkers = cluster.getAllChildMarkers();
        var childCount = childMarkers.length;
        return createCustomClusterMarker(childCount);
    },
    // Set the maximum zoom level for clustering
    disableClusteringAtZoom: 10 // Adjust the zoom level as needed
});


var schools;

// Define circle outside of the fetch callback
var defaultRadius = 5;

// Fetch school data from the backend API
fetch('http://localhost:5000/schools')
    .then(response => response.json())
    .then(data => { 
        schools = JSON.parse(data.schools);		
		
		// Parse the JSON data and add circle markers to the map
         schools.forEach(function(school) {
        var circleMarker = L.circleMarker([school.lat, school.lon], {
                color: 'grey', // Black outline color
                fillColor: getColor(school['grade']), // Set the fill color based on rating
                fillOpacity: 0.8, // Fill opacity
                radius: defaultRadius, // Use the default radius
				weight: 1, // Set the outline thickness to 1 pixel (adjust as needed)
                "URN": school.URN
            })
 // Bind a popup with school information
              // Add a click event listener to the circleMarker
    circleMarker.on('click', function() {
        // Call the showContent function to display school info content
        fetchSchoolInfo(school.URN);
        showContent("school-info-content", school);
    });
			
			   // Add the circle marker to the marker cluster group
             allMarkers.addLayer(circleMarker);
        });
		
	map.addLayer(allMarkers);
    });



function fetchSchoolInfo(URN) {
        // Create a request object
        fetch('http://localhost:5000/get-school-info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ URN: URN }) // Send the URN as JSON data
        })
            .then(response => response.json())
            .then(data => {
                console.log(data); // You can replace this with your code to populate the content

                // Iterate through the received data
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    // Select the placeholder element by ID
                    var placeholder = document.getElementById(key);

                    // Check if the placeholder exists
                    if (placeholder) {
                        // Update the content of the placeholder with the received value
                        placeholder.textContent = data[key];

                        if (['students_1', 'students_2', 'ks4_4', 'ks4_5'].includes(key) && ['0.0', '0%'].includes(data[key]))
                        {
                            placeholder.style.display = 'none';
                            var listItem = placeholder.previousElementSibling;
                            if (listItem) {
                                listItem.style.display = 'none';
                            }
                        }
                        else
                        {
                            placeholder.style.display = 'block';
                            var listItem = placeholder.previousElementSibling;
                            if (listItem) {
                                listItem.style.display = 'block';
                            }

                        }
                    }
                }
            }
        })
            .catch(error => {
                console.error('Error:', error);
            });
    }  ///end of fetchSchoolInfo(URN)

// Function to show/hide divs based on icon clicked
function showContent(contentId, school) {
    document.getElementById("school-info-content").style.display = "none";
    document.getElementById("filtering-content").style.display = "none";
    document.getElementById(contentId).style.display = "block";

    if (contentId=="school-info-content")
    {
        console.log("school", school)
    for (const key in sectionsVisibility) {
        school[key] === 0 ? $('#' + sectionsVisibility[key]).hide() : $('#' + sectionsVisibility[key]).show();
    }
    }
    
}

// Event listener for zoomend event
map.on('zoomend', function () {
    // Get the current zoom level
    zoomLevel = map.getZoom();

    // Calculate the scaling factor based on zoom level difference
    var scalingFactor = Math.max(1, zoomLevel - 10); // Adjust this value as needed

    // Iterate through the circle markers and update their radius
    allMarkers.eachLayer(function(layer) {
        // Calculate the updated radius based on the scaling factor
        var updatedRadius = defaultRadius * scalingFactor;

        // Set the updated radius for the circle marker
        layer.setRadius(updatedRadius);
    });
});

const schoolAgeAlignment = new Map([
    ['Primary', 'primary'],
    ['Secondary', 'secondary'],
    ['Post 16', 'post16']
]);

// Function to update map markers based on filters
function updateMapMarkers(filterValues) {
	
 // Filter the markers based on filterValues
    var filteredSchools = schools.filter(function (school) {
        // Implement your filtering logic here based on the filterValues object
        // For example, filtering by 'gender' and 'school-type'
        for (const filterType in filterValues) {
            if (filterType === 'school-age') {
                if (!filterValues[filterType].some(value => school[schoolAgeAlignment.get(value)] === 1)) {
                    // If any 'school-age' condition is not met, exclude the school
                    return false;
                }
            } else {
                if (!filterValues[filterType].includes(school[filterType])) {
                    // If any other condition is not met, exclude the school
                    return false;
                }
            }
        }
        // All filter criteria are met, include the school
        return true;
    });
	
	
  // Clear the map and remove all markers from the cluster group
  map.removeLayer(allMarkers);

  // Clear the allMarkers cluster group
  allMarkers.clearLayers();
	
    // Add filtered markers to the cluster group
    filteredSchools.forEach(function (school) {
        marker = L.circleMarker([school.lat, school.lon], {
                color: 'grey', // Black outline color
                fillColor: getColor(school['grade']), // Set the fill color based on rating
                fillOpacity: 0.8, // Fill opacity
                radius: defaultRadius, // Use the default radius
				weight: 1, // Set the outline thickness to 1 pixel (adjust as needed)
            })
        marker.bindPopup("<b>" + school.name + "</b><br>");
        
        marker.on('click', function() {
        // Call the showContent function to display school info content
        fetchSchoolInfo(school.URN);
        showContent("school-info-content", school);
    });

        allMarkers.addLayer(marker);
    });


 // Add the updated cluster group back to the map
 map.addLayer(allMarkers);
 // Refresh the cluster markers
 allMarkers.refreshClusters();
	
};


// Add a search control for geocoding
L.Control.geocoder().addTo(map);
