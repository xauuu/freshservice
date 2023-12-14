Handlebars.registerHelper("toJSON", function (object) {
  return new Handlebars.SafeString(JSON.stringify(object));
});
Handlebars.registerHelper("getParam", function (param) {
  const url = new URL(window.location.href);
  return url.searchParams.get(param);
});
authHeader = {
  Authorization: "Basic " + btoa("JOil58wOWFVYGJZ8pnt:x"),
  "Content-Type": "application/json"
};

defaultImage = `<svg width="40" height="40" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M7.828 5l-1-1H22v15.172l-1-1v-.69l-3.116-3.117-.395.296-.714-.714.854-.64a.503.503 0 0 1 .657.046L21 16.067V5zM3 20v-.519l2.947-2.947a1.506 1.506 0 0 0 .677.163 1.403 1.403 0 0 0 .997-.415l2.916-2.916-.706-.707-2.916 2.916a.474.474 0 0 1-.678-.048.503.503 0 0 0-.704.007L3 18.067V5.828l-1-1V21h16.172l-1-1zM17 8.5A1.5 1.5 0 1 1 15.5 7 1.5 1.5 0 0 1 17 8.5zm-1 0a.5.5 0 1 0-.5.5.5.5 0 0 0 .5-.5zm5.646 13.854l.707-.707-20-20-.707.707z" />
                    <path fill="none" d="M0 0h24v24H0z" />
                </svg>`;

function activeMenuItem() {
  (function () {
    var pushState = history.pushState;
    var replaceState = history.replaceState;

    history.pushState = function () {
      pushState.apply(history, arguments);
      window.dispatchEvent(new Event("pushstate"));
      window.dispatchEvent(new Event("locationchange"));
    };

    history.replaceState = function () {
      replaceState.apply(history, arguments);
      window.dispatchEvent(new Event("replacestate"));
      window.dispatchEvent(new Event("locationchange"));
    };

    window.addEventListener("popstate", function () {
      window.dispatchEvent(new Event("locationchange"));
    });
  })();

  window.addEventListener("locationchange", function () {
    const currentUrl = window.location.pathname;
    $(".nav-item").removeClass("active");
    $('.nav-item[href="' + currentUrl + '"]').addClass("active");
  });
}