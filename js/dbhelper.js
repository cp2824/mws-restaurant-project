//import dbPromise from './dbpromise';

function openDB() {
    return idb.open('mws-restaurant-project-db', 1, function(upgradeDb) {
        // case statement recommended by Jake in IDB lecture
        switch (upgradeDb.oldVersion) {
            case 0:
                // use a property id as a keypath
                upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });
        }
    })
}

/**
 * Common database helper functions.
 */
class DBHelper {

    /**
     * API URL
     * (Procedure suggested by Alexandro Perez to fetch data from sails API server)
     *   Return URL to access sails server without suffixing the restaurant's endpoint (make it universal)
     */
  static get API_URL() {
    const port = 1337; // Sails server url port
    return `http://localhost:${port}`;
    }
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   * ****Deprecated****
   */
  static get DATABASE_URL() {
    const port = 8000 // Change this to your server port
    return `http://localhost:${port}/data/restaurants.json`;
  }

    // A separate dbpromise file was suggested in Alexandro Perez's walkthrough, but I would rather put the database here.
    /******Start of code from dbpromise.js (also included openDB code above) ********/
    static iniitializeDB () {
    this.dbp = openDB()

  }
    /**
     * Save a restaurant or array of restaurants into idb, using promises.
     * can take an array of restaurants or a single restaurant
     */
    static putRestaurants(restaurants) {
        if (!restaurants.push) restaurants = [restaurants];
        return this.dbp.then(db => {
            // specify a read/write transaction for restaurants
            const store = db.transaction('restaurants', 'readwrite').objectStore('restaurants');
            // resolves only if the array of promises resolves
            Promise.all(restaurants.map(networkRestaurant => {
                // returns this promise on each element of the array
                // if we get a resataurant back from index db then it was already saved
                return store.get(networkRestaurant.id).then(idbRestaurant => {
                    // if it doesn't already exist in db then restaurant is undefined
                    // (works as a short circuit conditional statement)
                    // or if we get newly updated restaurant information (don't update with old info)
                    if (!idbRestaurant || networkRestaurant.updatedAt > idbRestaurant.updatedAt) {
                        // go ahead and store the restaurant in idb
                        return store.put(networkRestaurant);
                    }
                });
            })).then(function () {
                // resolves if all promises resolve successfully (true if everthing is ok)
                return store.complete;
            });
        });
    }

    /**
     * Get a restaurant, by its id (optional), or all stored restaurants in idb using promises.
     * If no argument is passed, all restaurants will returned.
     */
    getRestaurants(id = undefined) {
        return this.dbp.then(db => {
            // we are reading (that's the default), not read/write
            const store = db.transaction('restaurants').objectStore('restaurants');
            // if there is an id (convert a string to number)
            if (id) return store.get(Number(id));
            // if there is no id
            return store.getAll();
        });
    }
  /******End of code from dbpromise.js ********/
  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', `${DBHelper.API_URL}/restaurants`);
    xhr.onload = () => {
      if (xhr.status === 200) { // Got a success response from server!
          const restaurants = JSON.parse(xhr.responseText); //we are only getting an array now
          // TODO: Fix dbPromise database stuff
          this.putRestaurants(restaurants).then(restaurants => {
              callback(null, restaurants);// store the restaurants in the db
              //callback(null, restaurants);
          });
      }  else { // Oops!. Got an error from server.
        const error = (`Request failed. Returned status of ${xhr.status}`);
        callback(error, null);
      }
    };
    xhr.send();
  }

  /**
   * Fetch a restaurant by its ID.
   * Alexandro Perez recommended updating this code significantly to improve efficiency
   */
  static fetchRestaurantById(id, callback) {
      // fetch only the restaurant that we are using (by id)
      // Note that fetching ALL restaurants when you only need one is very inefficient
      // why use xhr when you can fetch a promise?  Asynchronous responses improve performance
      fetch(`${DBHelper.API_URL}/restaurants/${id}`).then(response => {
          // if the response is not ok, will be caught below
          if (!response.ok) return Promise.reject("Restaurant couldn't be fetched from network");
          // returns with a response if it is ok
          return response.json();
      }).then(fetchedRestaurant => {  //waits for the promise to be resolved, we need the callback after the resolved promise
          // if restaurant could be fetched from the network return the restaurant:
          return callback(null, fetchedRestaurant);  // we need the callback to wait for the response
      }).catch(networkError => {
          // if restaurant couldn't be fetched from the network return the error:
          return callback(networkError, null);
      });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
      /*the .html was breaking the details page*/
      return (`/restaurant?id=${restaurant.id}`);
      //return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.  This returns a medium size image by default.
   * Restaurant ID is returned if the image URL is missing.
   * This approach was suggested in Alexandro Perez's walkthrough.
   */
  static imageUrlForRestaurant(restaurant) {
    // we no longer need the split because we are only getting a number back (ie '10' instead of '10.jpg')
    // this helps handle when the image is missing from the API (workaround for when APIs have problems)
    let image = `/img/${(restaurant.photograph||restaurant.id)}-medium.jpg`;
    return image;
  }

  /**
   * This returns image srcset attribute to allow the browser to decide on the best resolution.
   * (this is reporting image pixel widths)
   * Restaurant ID is returned if the image source is missing.
   * This approach was suggested in Alexandro Perez's walkthrough.
   */
  static imageSrcset(restaurant) {
      // we no longer need the split because we are only getting a number back (ie '10' instead of '10.jpg')
      // this helps handle when the image is missing from the API (workaround for when APIs have problems)
      const imageSrc = `/img/${(restaurant.photograph||restaurant.id)}`;
      return `${imageSrc}-small.jpg 300w,
          ${imageSrc}-medium.jpg 600w,
          ${imageSrc}-large.jpg 800w`;
  }

  /**
   * This returns image sizes attribute so that the browser knows image sizes
   * before choosing an image to download.
   * (Currently setting limits to match stylesheet ranges).
   * This approach was suggested in Alexandro Perez's walkthrough.
   */
  static imageSizes(restaurant) {
      return `(max-width: 640px) 560px,
          (max-width: 1007px) 375px,
          375px`;
    }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

    /**
     * This function is used to set the map content to something useful when offline
     * Adding this function was suggested in Alexandro Perez's walkthrough
     */
    static mapOffline() {
        const map = document.getElementById('map');
        map.className = "map-offline";
        map.innerHTML = `<div class="map-heading">Did You Need This Map?</div>
    <div class="map-text">Maps appear to be offline. Please confirm you are connected to the internet or check back later.</div>`;
    }

}


