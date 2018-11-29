let restaurants,
  neighborhoods,
  cuisines
var newMap
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
        initMap(); // added
        fetchNeighborhoods();
        fetchCuisines();
        // confirm that the offline reviews are online if possible
        DBHelper.postReviewsOnline();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
    /** Use both navigator.onLine and try...catch to prevent errors from happening when trying to load Mapbox
     * This approach was suggested in Alexandro's walkthrough
     * We only attempt to initialize if we're online
     * Catching other errors allows us to log the error without stopping execution
     */
    if (navigator.onLine) {
        try {
            self.newMap = L.map('map', {
                center: [40.722216, -73.987501],
                zoom: 12,
                scrollWheelZoom: false
            });
            L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
                mapboxToken: 'pk.eyJ1IjoiY3BlcnJ5IiwiYSI6ImNqazQybW5zbjB0dWYzcXFxdjdjOHc1YnIifQ.My45l4j0D-9hsT7pkOwPbg',
                maxZoom: 18,
                attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
                '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
                'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                id: 'mapbox.streets'
            }).addTo(newMap);
        } catch(error) {
            console.log("Map couldn't be initialized", error);
            // Set map as offline when we catch and error (to display something meaningful)
            DBHelper.mapOffline();
        }
    } else {
        // Set map as offline if the navigator is not online (to display something meaningful)
        DBHelper.mapOffline();
    }
    updateRestaurants();
}
/* window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
} */

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.srcset = DBHelper.imageSrcset(restaurant);
  image.sizes = DBHelper.imageSizes(restaurant);
  image.alt = `Image for ${restaurant.name}`;
  li.append(image);

  const name = document.createElement('h1');
  name.innerHTML = restaurant.name;
  const flexbox = document.createElement('div');
    flexbox.className = 'flexbox';
    flexbox.append(name);
  const favButton = document.createElement('button');
    favButton.className = 'fav-btn';
    favButton.innerHTML = "&#x2764;";
    favButton.dataset.id = restaurant.id; // store restaurant id in dataset for later
    favButton.setAttribute('aria-label', `Mark ${restaurant.name} as a favorite`);
    favButton.setAttribute('aria-pressed', restaurant.is_favorite);
    favButton.onclick = handleClick;
    flexbox.append(favButton);
  li.append(flexbox);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.setAttribute('aria-label', `View details for ${restaurant.name}`);
  li.append(more)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
    /**
     * If we are offline, newMap or L may be undefined.
     * It would be better to exit early than to attempt to execute this code with undefined variables
     */
  if (!newMap || !L) return;
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });

} 
/* addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
} */

function handleClick() {
    const restaurantId = this.dataset.id;
    const fav = this.getAttribute('aria-pressed') == 'true';
    const url = `${DBHelper.API_URL}/restaurants/${restaurantId}/?is_favorite=${!fav}`;
    const PUT = {method: 'PUT'};

 /**   // TODO: use Background Sync to sync data with API server
    if (!window.SyncManager || !navigator.serviceWorker) {
        return fetch(url, PUT).then(response => {
            if (!response.ok) return Promise.reject("We couldn't mark restaurant as favorite.");
            return response.json();
        }).then(updatedRestaurant => {
            // update restaurant on idb
            // TODO: Update data in idb, to reflect the restaurant as favorite or not. You need to update two properties isfavorite and updatedAt. For updatedAt you can use new Date().toISOString.
            dbPromise.putRestaurants(updatedRestaurant, true);

            // change state of toggle button
            this.setAttribute('aria-pressed', !fav);
        });
    } else {
        dbPromise.putRestaurants(restaurantId, true);
        dbPromise.putFavorite(restaurantId, !fav)
        // change state of toggle button
        this.setAttribute('aria-pressed', !fav);
    }**/
    return fetch(url, PUT).then(response => {
        if (!response.ok) return Promise.reject("We couldn't mark restaurant as favorite.");
        return response.json();
    }).then(updatedRestaurant => {
        // update restaurant on idb
        // TODO: Update data in idb, to reflect the restaurant as favorite or not. You need to update two properties isfavorite and updatedAt. For updatedAt you can use new Date().toISOString.
        dbPromise.putRestaurants(updatedRestaurant, true);
        // change state of toggle button
        this.setAttribute('aria-pressed', !fav);
    });
}