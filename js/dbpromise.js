// This file was suggested in Alexandro Perez's walkthrough.

const dbPromise = {
    db: idb.open('mws-restaurant-project-db', 1, function(upgradeDb) {
        // case statement recommended by Jake in IDB lecture
        switch (upgradeDb.oldVersion) {
            case 0:
                // use a property id as a keypath
                upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });
        }
    }),

    /**
     * Save a restaurant or array of restaurants into idb, using promises.
     * can take an array of restaurants or a single restaurant
     */
    putRestaurants(restaurants) {
        if (!restaurants.push) restaurants = [restaurants];
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
        // if there is an id (convert a string to number)
        if (id) return store.get(Number(id));
        // if there is no id
        return store.getAll();
    });
    },

};
