let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
        initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
    fetchRestaurantFromURL((error, restaurant) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            /**
             * Use both navigator.onLine and try...catch to prevent errors from happening when trying to load Mapbox
             * This approach was suggested in Alexandro's walkthrough
             * We only attempt to initialize if we're online
             * Catching other errors allows us to log the error without stopping execution
             */
        if (navigator.onLine) {
        try {
            self.newMap = L.map('map', {
                center: [restaurant.latlng.lat, restaurant.latlng.lng],
                zoom: 16,
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
            DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
        } catch(error) {
            console.log("Map couldn't be initialized", error);
            // Set map as offline when we catch an error (to display something meaningful)
            DBHelper.mapOffline();
        }
    } else {
        // Set map as offline if the navigator is not online (to display something meaningful)
        DBHelper.mapOffline();
    }
    fillBreadcrumb();
    DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
}
});
}

/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 * uses new helper method to fetch reviews from the new endpoint (phase 3)
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;
    const favButton = document.getElementById('fav-btn');
    //favButton.className = 'fav-btn';
    //favButton.setAttribute('class', 'fav-btn')
    favButton.innerHTML = "&#x2764;";
    favButton.dataset.id = restaurant.id; // store restaurant id in dataset for later
    favButton.setAttribute('aria-label', `Mark ${restaurant.name} as a favorite`);
    favButton.setAttribute('aria-pressed', restaurant.is_favorite);
    favButton.onclick = handleClick;
  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.srcset = DBHelper.imageSrcset(restaurant);
  image.sizes = DBHelper.imageSizes(restaurant);
  image.alt = `Image for ${restaurant.name}`;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews - reviews are no longer stored in the restaurant object
  DBHelper.fetchReviewsByRestaurantId(restaurant.id)
      .then(fillReviewsHTML);
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

    if (!reviews) {
        const noReviews = document.createElement('p');
        noReviews.innerHTML = 'No reviews yet!';
        container.appendChild(noReviews);
    } else {
        const ul = document.getElementById('reviews-list');
        reviews.forEach(review => {
            ul.appendChild(createReviewHTML(review));
        });
        container.appendChild(ul);
    }

    const h3 = document.createElement('h3');
    h3.innerHTML = "Leave a Review";
    container.appendChild(h3);
    const id = getParameterByName('id');
    container.appendChild(reviewForm(id));
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  // Reviews now have a createdAt and updatedAt property, but no date
  // Date.prototype.toLocaleDateString() converts this into a human readable format
  date.innerHTML = new Date(review.createdAt).toLocaleDateString();
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function handleClick() {
    const restaurantId = this.dataset.id;
    const fav = this.getAttribute('aria-pressed') == 'true';
    const url = `${DBHelper.API_URL}/restaurants/${restaurantId}/?is_favorite=${!fav}`;
    const PUT = {method: 'PUT'};

    // TODO: use Background Sync to sync data with API server
    return fetch(url, PUT).then(response => {
        if (!response.ok) return Promise.reject("We couldn't mark restaurant as favorite.");
        return response.json();
    }).then(updatedRestaurant => {
        // update restaurant on idb
        dbPromise.putRestaurants(updatedRestaurant, true);
        // change state of toggle button
        this.setAttribute('aria-pressed', !fav);
    });
}

/**
 * Returns a li element with review data so it can be appended to
 * the review list.
 */
function createReviewHTML(review) {
    const li = document.createElement('li');
    const name = document.createElement('p');
    name.innerHTML = review.name;
    li.appendChild(name);

    const date = document.createElement('p');
    date.innerHTML = new Date(review.createdAt).toLocaleDateString();
    li.appendChild(date);

    const rating = document.createElement('p');
    rating.innerHTML = `Rating: ${review.rating}`;
    li.appendChild(rating);

    const comments = document.createElement('p');
    comments.innerHTML = review.comments;
    li.appendChild(comments);

    return li;
}

/**
 * Clear form data
 */
function clearForm() {
    // clear form data
    document.getElementById('name').value = "";
    document.getElementById('rating').selectedIndex = 0;
    document.getElementById('comments').value = "";
}

/**
 * Make sure all form fields have a value and return data in
 * an object, so is ready for a POST request.
 */
function validateAndGetData() {
    const data = {};

    // get name
    let name = document.getElementById('name');
    if (name.value === '') {
        name.focus();
        return;
    }
    data.name = name.value;

    // get rating
    const ratingSelect = document.getElementById('rating');
    const rating = ratingSelect.options[ratingSelect.selectedIndex].value;
    if (rating == "--") {
        ratingSelect.focus();
        return;
    }
    data.rating = Number(rating);

    // get comments
    let comments = document.getElementById('comments');
    if (comments.value === "") {
        comments.focus();
        return;
    }
    data.comments = comments.value;

    // get restaurant_id
    let restaurantId = document.getElementById('review-form').dataset.restaurantId;
    data.restaurant_id = Number(restaurantId);

    // set createdAT
    data.createdAt = new Date().toISOString();

    return data;
}

/**
 * Handle submit.
 */
function handleSubmit(e) {
    e.preventDefault();
    const review = validateAndGetData();
    if (!review) return;

    console.log(review);

    const url = `${DBHelper.API_URL}/reviews/`;
    const POST = {
        method: 'POST',
        body: JSON.stringify(review)
    };
    console.log(POST);
    /**
    // post new review on page
    const reviewList = document.getElementById('reviews-list');
    const reviewEl = createReviewHTML(review);
    reviewList.appendChild(reviewEl);
    console.log("Review Posted");
    // clear form
    clearForm();
    console.log("Form Cleared");
    //dbPromise.putReviews(POST);
    //console.log("Review in local db");
    dbPromise.queueReview(review);
    return false;
     **/
    // TODO: use Background Sync to sync data with API server
    return fetch(url, POST).then(response => {
        if (!response.ok) return Promise.reject("We couldn't post review to server.");
        //dbPromise.queueReview(review);
        return response.json();
    }).then(newNetworkReview => {
        // save new review on idb
        dbPromise.putReviews(newNetworkReview);
        // post new review on page
        const reviewList = document.getElementById('reviews-list');
        const review = createReviewHTML(newNetworkReview);
        reviewList.appendChild(review);
        // clear form
        clearForm();
        // need to test our new function to post offline reviews
        DBHelper.postReviewsOnline();
        return false;
    }).catch(networkError => {
        console.log('${networkError}, queueing review.');
        const review = validateAndGetData();
        if (!review) return;
        dbPromise.queueReview(review);
        dbPromise.putReviews(review);
        // post new review on page
        const reviewList = document.getElementById('reviews-list');
        const reviewHTML = createReviewHTML(review);
        reviewList.appendChild(reviewHTML);
        // clear form
        clearForm();
        return false;
    });
}

/**
 * The following functions are used to generate and process entries into our review form
 * Alexandro Perez suggested adding these into a separate file, but I will include them here
 */
/**
 * Returns a form element for posting new reviews.
 */
function reviewForm(restaurantId) {
    const form = document.createElement('form');
    form.id = "review-form";
    form.dataset.restaurantId = restaurantId;

    let p = document.createElement('p');
    const name = document.createElement('input');
    name.id = "name"
    name.setAttribute('type', 'text');
    name.setAttribute('aria-label', 'Name');
    name.setAttribute('placeholder', 'Enter Your Name');
    p.appendChild(name);
    form.appendChild(p);

    p = document.createElement('p');
    const selectLabel = document.createElement('label');
    selectLabel.setAttribute('for', 'rating');
    selectLabel.innerText = "Your rating: ";
    p.appendChild(selectLabel);
    const select = document.createElement('select');
    select.id = "rating";
    select.name = "rating";
    select.classList.add('rating');
    ["--", 1,2,3,4,5].forEach(number => {
        const option = document.createElement('option');
        option.value = number;
        option.innerHTML = number;
        if (number === "--") option.selected = true;
        select.appendChild(option);
    });
    p.appendChild(select);
    form.appendChild(p);

    p = document.createElement('p');
    const textarea = document.createElement('textarea');
    textarea.id = "comments";
    textarea.setAttribute('aria-label', 'comments');
    textarea.setAttribute('placeholder', 'Enter any comments here');
    textarea.setAttribute('rows', '10');
    p.appendChild(textarea);
    form.appendChild(p);

    p = document.createElement('p');
    const addButton = document.createElement('button');
    addButton.setAttribute('type', 'submit');
    addButton.setAttribute('aria-label', 'Add Review');
    addButton.classList.add('add-review');
    addButton.innerHTML = "<span>Post Review</span>";
    p.appendChild(addButton);
    form.appendChild(p);

    form.onsubmit = handleSubmit;

    return form;
};