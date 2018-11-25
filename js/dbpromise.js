// This file was suggested in Alexandro Perez's walkthrough.
// Use of these calls is well documented there, but I've made sure to add notes about my understanding of the code.
// chages tied to this code also exist in dbhelper functions that call these functions

const dbPromise = {
    db: idb.open('restaurant-reviews-db', 2, function(upgradeDb) {
        // case statement recommended by Jake in IDB lecture
        switch (upgradeDb.oldVersion) {
            case 0:
                // use a property id as a keypath
                upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });
            case 1:
                // creates a reviews store using restaurant_id as the index
                upgradeDb.createObjectStore('reviews', { keyPath: 'id' })
                    .createIndex('restaurant_id', 'restaurant_id');
        }
    }),

    /**
     * Save a restaurant or array of restaurants into idb, using promises.
     * can take an array of restaurants or a single restaurant
     */
    putRestaurants(restaurants) {
        // if restaurants isn't an array then convert it into one
        if (!restaurants.push) restaurants = [restaurants];
        // this is the database we initialized above
        return this.db.then(db => {
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
    },

    /**
     * Get a restaurant, by its id (optional), or all stored restaurants in idb using promises.
     * If no argument is passed, all restaurants will returned.
     */
    getRestaurants(id = undefined) {
        return this.db.then(db => {
            // we are reading (that's the default), not read/write
            const store = db.transaction('restaurants').objectStore('restaurants');
        // if there is an id (convert a string to number). We return a restaurant by that id.
        if (id) return store.get(Number(id));
        // if there is no id we return all restaurants in our database
        return store.getAll();
    });
    },

    /**
     * Save a review or array of reviews into idb, using promises
     * note similarities to putRestaurants above
     */
    putReviews(reviews) {
        // this converts a single review into an array of reviews
        if (!reviews.push) reviews = [reviews];
        return this.db.then(db => {
            // specify a read/write transaction for reviews
            const store = db.transaction('reviews', 'readwrite').objectStore('reviews');
            // resolves only if the array of promises resolves
            Promise.all(reviews.map(networkReview => {
                // returns this promise on each element of the array
                // if we get a review back from index db then it was already saved
                return store.get(networkReview.id).then(idbReview => {
                    // if it doesn't already exist in db then review is undefined
                    // (works as a short circuit conditional statement)
                    // or if we get newly updated review information (don't update with old info)
                    if (!idbReview || networkReview.updatedAt > idbReview.updatedAt) {
                        // go ahead and store the restaurant in idb
                        return store.put(networkReview);
                    }
                });
            })).then(function () {
                // resolves if all promises resolve successfully (true if everthing is ok)
                return store.complete;
            });
        });
    },

    /**
     * Get all reviews for a specific restaurant, by its id, using promises.
     * Key difference from getRestaurants above - must pass an argument
     */
    getReviewsForRestaurant(id) {
        return this.db.then(db => {
            // we are reading (that's the default), not read/write
            const storeIndex = db.transaction('reviews').objectStore('reviews').index('restaurant_id');
            // if there is an id (convert a string to number). We return a restaurant by that id.
            return storeIndex.getAll(Number(id));
        });
    },

};