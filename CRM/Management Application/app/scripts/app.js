document.onreadystatechange = function () {
  initMap();
  if (document.readyState === "interactive") renderApp();
  function renderApp() {
    var onInit = app.initialized();

    onInit.then(getClient).catch(handleErr);

    function getClient(_client) {
      window.client = _client;
      client.events.on("app.activated", onAppActivate);
    }
  }
};

function onAppActivate() {
  initMap();
}

function handleErr(error) {
  console.log(error);
}

function initMap() {
  new google.maps.Map(document.getElementById("initMap"), {
    center: { lat: 1.3139946, lng: 103.6794355 },
    zoom: 15
  });
}
