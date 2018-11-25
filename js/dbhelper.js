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

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', `${DBHelper.API_URL}/restaurants`);
    xhr.onload = () => {
      if (xhr.status === 200) { // 200 means we got a success response from the server
          const restaurants = JSON.parse(xhr.responseText); //we are only getting an array now (starting in project 2)
          dbPromise.putRestaurants(restaurants); //store all restaurants into our database
          callback(null, restaurants); // return no error and the restaurants
      } else { // Oops!. Got an error from server.
          console.log(`Request failed. Returned status of ${xhr.status}, trying idb...`);
          // if xhr request isn't code 200 (need xhr on error (below) to handle when the server is down), see if it's in our database
          dbPromise.getRestaurants().then(idbRestaurants => {
              // if we get back more than 1 restaurant from our database, return idbRestaurants (can be 1 to many)
              if (idbRestaurants.length > 0) {
                  callback(null, idbRestaurants)
              } else { // if we got back 0 restaurants return an error - nothing has been saved to index db yet
                  callback('No restaurants found in idb', null);
              }
          });
      }
    };
      // XHR needs error handling for when server is down (doesn't respond or sends back codes) (ex, connection refused)
      // this extra error handling isn't necessary when we aren't using XHR (see below in fetchRestaurantById)
      xhr.onerror = () => {
          console.log('Error while trying XHR, trying idb...');
          // try idb, and if we get restaurants back, return them, otherwise return an error
          // same thing as above, only send them if we have 1 or more
          dbPromise.getRestaurants().then(idbRestaurants => {
              if (idbRestaurants.length > 0) {
                  callback(null, idbRestaurants)
              } else { // if we got back 0 restaurants return an error - nothing has been saved to index db yet
                  callback('No restaurants found in idb', null);
              }
          });
      }
    xhr.send();
  }

  /**
   * Fetch a restaurant by its ID.
   * Alexandro Perez recommended updating this code significantly to improve efficiency (only ask for 1 if you need 1)
   */
  static fetchRestaurantById(id, callback) {
      // fetch only the restaurant that we are using (by id)
      // Note that fetching ALL restaurants when you only need one is very inefficient
      // why use xhr when you can fetch a promise?  Asynchronous responses improve performance
      fetch(`${DBHelper.API_URL}/restaurants/${id}`).then(response => {
          // if the response is not ok, will be caught below
          // response.ok handles much of the error checking we had to do manually with xhr above
          if (!response.ok) return Promise.reject("Restaurant couldn't be fetched from network");
          // returns with a response if it is ok
          return response.json();
      }).then(fetchedRestaurant => {  //waits for the promise to be resolved, we need the callback after the resolved promise
          // if restaurant could be fetched from the network return the restaurant:
          dbPromise.putRestaurants(fetchedRestaurant); // put the restaurant into our db (just the one we fetched)
          return callback(null, fetchedRestaurant);  // we need the callback to wait for the response
      }).catch(networkError => { // catches any error we receive as well as issues tied to not connecting to the server
          // if restaurant couldn't be fetched from the network return the error:
          console.log(`${networkError}, trying idb.`);
          dbPromise.getRestaurants(id).then(idbRestaurant => { //still try getting the data from idb
              if (!idbRestaurant) return callback("Restaurant not found in idb either", null); // if it's not in the idb all we can send is the error
              return callback(null, idbRestaurant); // we still return the data from idb (if it exists) when we get errors or the server is down
          });
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

    /**
     * Accesses the new endpoint for reviews (phase 3)
     * Adding this function was suggested in Alexandro Perez's walkthrough
     * Note similarities to fetchRestaurantById
     */
    static fetchReviewsByRestaurantId(restaurant_id) {
        // fetch only reviews for the restaurant that we are using (by id)
        return fetch(`${DBHelper.API_URL}/reviews/?restaurant_id=${restaurant_id}`).then(response => {
            // if the response is not ok, will be caught below
            // response.ok handles much of the error checking we would have to do manually with xhr
            if (!response.ok) return Promise.reject("Reviews couldn't be fetched from network");
            // returns with a response if it is ok
            return response.json();
        }).then(fetchedReviews => {//waits for the promise to be resolved, we need the callback after the resolved promise
            // if reviews could be fetched from network:
            dbPromise.putReviews(fetchedReviews); // store reviews on idb
            return fetchedReviews; // we need the callback to wait for the response
        }).catch(networkError => { // catches any error we receive as well as issues tied to not connecting to the server
            // if reviews couldn't be fetched from network try to get reviews from idb
            console.log(`${networkError}, trying idb.`);
            return dbPromise.getReviewsForRestaurant(restaurant_id).then(idbReviews => { //still try getting the data from idb
                // if no reviews were found on idb return null
                if (idbReviews.length < 1) return null;
                return idbReviews; // we still return the data from idb (if it exists) when we get errors or the server is down
            });
        });
    }

}


