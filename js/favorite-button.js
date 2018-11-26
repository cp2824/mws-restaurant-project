// This file was suggested in Alexandro Perez's walkthrough.
// Use of these calls is well documented there, but I've made sure to add notes about my understanding of the code.
// chages tied to this code also exist in main.js and restaurant_info.js functions that call these functions

/** Trying another approach
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
**/

/**
 * Returns a button element for the specified restaurant
 */
/**
export default function favoriteButton(restaurant) {
    const button = document.createElement('button');
    button.innerHTML = "&#x2764;"; // this is the heart symbol in hex code
    button.className = "fav"; // you can use this class name to style your button
    button.dataset.id = restaurant.id; // store restaurant id in dataset for later
    button.setAttribute('aria-label', `Mark ${restaurant.name} as a favorite`);
    button.setAttribute('aria-pressed', restaurant.is_favorite);
    button.onclick = handleClick;

    return button;
}
 **/

/**
 * This favorite button code was suggested here:
 * https://codepen.io/mapk/pen/ZOQqaQ
 */



// Favorite Button - Heart
$('.favme').click(function() {
    $(this).toggleClass('active');
});

/* when a user clicks, toggle the 'is-animating' class */
$(".favme").on('click touchstart', function(){
    $(this).toggleClass('is_animating');
});

/*when the animation is over, remove the class*/
$(".favme").on('animationend', function(){
    $(this).toggleClass('is_animating');
});