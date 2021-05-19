var map, infoWindow;
var area = document.getElementById("area-shelters");
var submit = document.getElementById("submit");
var filter = $("#filter-by")
var APIKey = "2BaEcf0ZgdGwgCVUIyjT2UPf4jU9zxevFmBqo3hap8bQXM09uf";
var secret = "ChtFchPni9L0Arf2Z2A3RAKwNtxflJ48oRRI93mC";
var queryURL = "https://api.petfinder.com/v2/oauth2/token";
var state = '';
var zip = ''
var userLocation = ''
var type = ''
var breed = ''
var gender = ''
var page = 1
var pics = $("#pics");
var orgs = []
var pets = []
var zip = ''
var distance = 100

var totalPages = ''
var markers = [];
var firebaseConfig = {
  apiKey: "AIzaSyDx9AJil2cmsXMQfZdGI0Nz8W5XzCkiWC0",
  authDomain: "pets-fur-friends-4ad35.firebaseapp.com",
  projectId: "pets-fur-friends-4ad35",
  storageBucket: "pets-fur-friends-4ad35.appspot.com",
  messagingSenderId: "724660945175",
  appId: "1:724660945175:web:e814fa87e10454b362f752",
  measurementId: "G-9BV1R6D3J6",
  databaseURL: "https://pets-fur-friends-4ad35-default-rtdb.firebaseio.com/"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

var database = firebase.database();

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: -34.397, lng: 150.644 },
    zoom: 6,
    zoomControl: false,
    fullscreenControl: false,
    streetViewControl: false
  });
  infoWindow = new google.maps.InfoWindow;
  // Try HTML5 geolocation.
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
      var pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      map.setCenter(pos);
      var marker = new google.maps.Marker({
        position: pos,
        map: map,
        title: "You are here"
      });
      markers.push(marker);
    }, function () {
      handleLocationError(true, infoWindow, map.getCenter());
    });
  } else {
    // Browser doesn't support Geolocation
    handleLocationError(false, infoWindow, map.getCenter());
  }
};

// retrieve google maps API key from firebase then load the map
database.ref().once('value').then(function (snap) {
  key = snap.val().gKey;
  var tag = 'https://maps.googleapis.com/maps/api/js?key=' + key + '&callback=initMap';
  var body = document.getElementById("main");
  var ele = document.createElement("script");
  ele.setAttribute("src", tag);
  body.appendChild(ele);
});


area.addEventListener("click", function () {
  orgs = []; // make sure to empty organization data so we don't bring the info from the previous call
  if (markers.length > 0){
    for (i = 0; i < markers.length; i++) {
      markers[i].setMap(null);
      markers[i] = null;
    }
    markers = [];
  }
  // get user coordinates
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
      var pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      // retrieve api key then fetch geocode data
      database.ref().once('value').then(function (snap) {
       var key = snap.val().gKey;
        var url = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + pos.lat + "," + pos.lng + "&key=" + key;
        fetch(url).then((response) => {
          return response.json();
        })
          .then((data) => {
            var componentLength = data.results[0].address_components.length
            for (var i = 0; i < componentLength; i++) {
              if (data.results[0].address_components[i].long_name.length === 5) {
                userLocation = data.results[0].address_components[i].long_name
              }
            }
            console.log(data);
            // get organization data
            getOrg();
            var int = setInterval(function () { // every 1/10th of a second, check to see if orgs has been populated with data
              if (orgs.length > 0) {
                for (i = 0; i < orgs.length; i++) {
                  var addr = orgs[i].address.address1;
                  if (addr === null) {
                    addr = orgs[i].address.postcode;
                  } else { // if address line exists, we'll use both the address line and zip
                    addr = orgs[i].address.address1 + ", " + orgs[i].address.postcode;
                  }
                  // good to go to set a Marker on the map

                  var infoText = "Name: " + orgs[i].name;
                  let name = orgs[i].name;
                  if (name === null) {
                    name = 'N/A';
                  }
                  let email = orgs[i].email;
                  if (email === null) {
                    email = 'N/A';
                  }
                  let phone = orgs[i].phone;
                  if (phone === null) {
                    phone = 'N/A';
                  }
                  let website = orgs[i].website;
                  if (website === null) {
                    website = 'N/A';
                  } else {
                    website = '<a href="' + website + '">' + website + '</a>';
                  }
                  let address = orgs[i].address.address1;
                  if (address === null) {
                    address = 'N/A';
                  }
                  var infoText = "Name: " + name;
                  setMarker(addr, infoText,

                    '<div id="info-name">' + name + '</div>' + '<hr>' +  '<div>Address: ' + address + '</div>' + '<div>Website: ' + website + '</div>' + '<span>Phone: ' + phone + '</span>' + '<div>E-mail: ' + '<a href="mailto:' + email + '?Subject=" target="_top">' + email + '</a>');

                }
                clearInterval(int); // clear the timer and proceed
              }
            }, 100);
            map.zoom = 8;
          });
      });
    });

  }
});
async function getOrg() {
  fetch('https://api.petfinder.com/v2/oauth2/token', {
    method: 'POST',
    body: 'grant_type=client_credentials&client_id=' + APIKey + '&client_secret=' + secret,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }).then(function (resp) {
    // Return the response as JSON
    orgs = resp.json();
    return orgs;
  }).then(function (data) {
    // console logs token as json, then the api call happens
    console.log('token', data)
    return fetch('https://api.petfinder.com/v2/organizations?location=' + userLocation, {
      headers: {
        'Authorization': data.token_type + ' ' + data.access_token,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
  }).then(function (resp) {
    // Return the API response as JSON and sets orgs to the response, returns it
    return (resp.json());
  }).then(function (data) {
    // Log the pet data
    orgs = data.organizations;
    console.log('orgs', data);
  }).catch(function (err) {
    // Log any errors
    console.log('something went wrong', err);
  })
}
// Adds function that makes API call to return Animals object as json object
function getAnimals() {
  fetch('https://api.petfinder.com/v2/oauth2/token', {
    method: 'POST',
    body: 'grant_type=client_credentials&client_id=' + APIKey + '&client_secret=' + secret,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }).then(function (resp) {
    // Return the response as JSON
    return resp.json();
  }).then(function (data) {
    // makes api call with search parameters
 return fetch('https://api.petfinder.com/v2/animals?location=' + userLocation + '&distance=' + distance + '&limit=9' + '&type=' + type + '&breed=' + breed + '&gender=' + gender + '&page=' + page, {


      headers: {
        'Authorization': data.token_type + ' ' + data.access_token,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
  }).then(function (resp) {
    // Return the API response as JSON
    pets = resp.json();
    return pets
  }).then(function (data) {
    totalPages = data.pagination.total_pages
    $("#loading").html("")
    $("#loading").hide()
    // Log the pet data
    console.log('pets', data);
    pics.html("")
    var results = data.animals.length
    //div.addClass('card')
    for (var i = 0; i < results; i++) {
      var button = $("<button>")
      button.attr('type', 'button')
      button.addClass("btn")
      button.addClass("bookmark")
      button.text('Bookmark')
      //console.log(results[i]);
      var div = $("<div>");
      var nameDiv = $("<div>");
      var ageDiv = $("<div>")
      var locDiv = $("<div>")
      var disDiv = $("<div>")
      nameDiv.addClass('card-info');
      div.addClass('card');
      var refId = data.animals[i].id
      var url = data.animals[i].url
      console.log(url)
      console.log(refId)
      button.attr('bookmark', refId)
      button.attr('data-state', 'add')
      button.attr('idk', url)
      var name = data.animals[i].name;
      var age = data.animals[i].age;
      var city = data.animals[i].contact.address.city
      var state = data.animals[i].contact.address.state
      var distance = data.animals[i].distance
      var picturetag = (data.animals[i].photos[0]?.large || "images/d6e35b19-3dee-41b3-b052-4e7e9db58292_200x200.png");
      button.attr('src', picturetag)
      var disRound = Math.round(distance);
      div.append("<br>" + name + "<br>");
      div.append('<img src="' + picturetag + '"/>' + "<br>" + "<br>");
      pics.append(div);
      div.append(ageDiv);
      div.append(locDiv);
      div.append(disDiv)
      div.attr("data-url", data.animals[i].url);
      locDiv.append("Age:", " ", age + "<br>");
      div.append("Location:", " ", city, ", ", state + "<br>" + "<br>");
      disDiv.append("Distance:", " ", disRound + " ", "miles away");
      div.append(button)
      }
    
    $(".card").click(function(){
       window.open($(this).attr("data-url"))
     })
     
    $(".bookmark").click(function(event){
      event.stopPropagation()
      $(".carousel").show()
      var url = $(this).attr('idk')
      var toggle = $(this).attr('data-state')
      var img = $("<img>")
      var carouselDiv = $("<div>")
      if (toggle === 'add'){
      $(this).text('Remove')
      carouselDiv.addClass("carousel-item")
      img.attr('src', $(this).attr('src'))
      img.attr('data-url', url)
      img.addClass('d-block')
      img.addClass('w-100')
      img.addClass('car-image')
      carouselDiv.append(img)
      $(".carousel-inner").append(carouselDiv)
      $("#carouselExampleControls").carousel(1)
      $(this).attr('data-state', 'remove')
      }else{
        $(this).text('Bookmark')
        $('.d-block').remove()
        carouselDiv.append(img)
        $(this).attr('data-state', 'add')
      }
      $(document).on('click', '.car-image', function(){
        window.open($(this).attr("data-url"))
      })

    })
   

    console.log(results)
  }).catch(function (err) {
    // Log any errors
    alert('Whoops! Looks like you\'ve entered an invalid search parameter. Please try your search again using a different key word.')
    console.log('something went wrong', err);
  });
}
// calls both functions
//getOrg();
//getAnimals();
// this button increases the page number and displays new set of pets
$("#page-next").on("click", function () {
  page++
  if (page > totalPages) {
    page = totalPages
  }
  pics.html("")
  loading();
  getAnimals()
  pageNumber();
})
$("#page-previous").on("click", function () {
  page--
  if (page < 1) {
    page = 1
  }
  pics.html("")
  loading();
  getAnimals()
  pageNumber();
})

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(browserHasGeolocation ?
    'Error: The Geolocation service failed.' :
    'Error: Your browser doesn\'t support geolocation.');
  infoWindow.open(map);
}
function setMarker(address, titleText, htmlContent) {
  database.ref().once('value').then(function (snap) {
   var key = snap.val().gKey;

    var url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + address + "&key=" + key;
    fetch(url).then(response => {
      return response.json();
    }).then(data => {
      var coords = data.results[0].geometry.location;
      map.setCenter(coords);
      var marker = new google.maps.Marker({
        position: coords,
        map: map,
        title: titleText
      });
      markers.push(marker);
      marker.addListener('click', function () {
        infoWindow.setPosition(coords);
        infoWindow.setContent(htmlContent);
        infoWindow.open(map);
      });
    });

  })
}
function getZip(callback) {
  // get user coordinates
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
      var pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      // get user location based on coordinates
      database.ref().once('value').then(function (snap) {
      var key = snap.val().gKey;
        var url = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + pos.lat + "," + pos.lng + "&key=" + key;
        fetch(url).then(response => {
          return response.json();
        }).then(data => {
          var componentLength = data.results[0].address_components.length
          for (var i = 0; i < componentLength; i++) {
            if (data.results[0].address_components[i].long_name.length === 5) {
              userLocation = data.results[0].address_components[i].long_name;
              console.log(data);
              console.log("current location = " + userLocation);
              if (userLocation) {
                displayZip()
                getAnimals()
              }
            }
          }
        });
      });
    });
  }
}
submit.addEventListener("click", function (e) {
  e.preventDefault();
  document.getElementById('pics').scrollIntoView({ behavior: "smooth"} )
  if (markers.length > 0) {
    for (i = 0; i < markers.length; i++) {
      markers[i].setMap(null);
      markers[i] = null;
    }
    markers = [];
  }
  if (page > 1) {
    page = 1
    pageNumber()
  }
  state = $("#userState").val().trim().toUpperCase();
  zip = $("#userZipCode").val().trim()
  
  if (zip && state) { // move cursor based on user input
    setMarker(state + ", " + zip, null, zip);
  } else if (!zip && state) {
    setMarker(state, null, state);
  } else if (zip && !state){
    setMarker(zip, null, zip);
  }

  if (!zip && !state) {
    zip = userLocation
  } else if (!zip) {
    userLocation = state
  } else if (!state) {
    userLocation = zip
  } else {
    userLocation = zip + ',' + ' ' + state
  }
  alert(userLocation)
  type = $("#userAnimal").val().trim()
  breed = $("#userBreed").val().trim()
  gender = $("#userGender").val()
  distance = parseInt($("#userDist").val())
  pics.html("")
  loading();
  getAnimals();
});
function pageNumber() {
  var pagenumber = $(".page-number")
  pagenumber.text(`Page: ${page}`)
}
function displayZip() {
  var mapsLocation = $("#userLocation")
  mapsLocation.text(`Your Location : ${userLocation}`)
}
function loading() {
  var loading = $("#loading")
  loading.show()
  var dogAnimation = $('<img src="images/dog-animation.png">')
  dogAnimation.addClass('yo')
  loading.text('Loading pets, please wait...')
  loading.append(dogAnimation)
}

function carouselHide(){
  $(".carousel").hide()
}

loading()
pageNumber();
getZip()
carouselHide()