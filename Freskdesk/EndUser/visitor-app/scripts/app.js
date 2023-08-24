document.onreadystatechange = function () {
  if (document.readyState === "interactive") renderApp();

  async function renderApp() {
    try {
      window.client = await app.initialized();
      client.events.on("app.activated", onAppActivate);
    } catch (err) {
      handleErr(err);
    }
  }
};

async function onAppActivate() {
  try {
    let { portal } = await client.data.get("portal");

    let textElement = document.getElementById("apptext");
    textElement.innerHTML = `Portal name: ${portal.name}`;
    document.getElementById("btn").addEventListener("click", async function () {
      let data = await client.interface.trigger("showConfirm", {
        title: "Are you sure about this ? ",
        message: "This action will delete the data permanently",
        saveLabel: "Continue",
        cancelLabel: "Cancel",
        closeOnEscape: true
      });
      console.log(data);
    });
  } catch (err) {
    handleErr(err);
  }
}

function handleErr(err) {
  console.error(`Error occured. Details:`, err);
}
