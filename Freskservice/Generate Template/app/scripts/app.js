document.onreadystatechange = function () {
    if (document.readyState === 'interactive') renderApp();

    function renderApp() {
        const onInit = app.initialized();

        onInit.then(getClient).catch(handleErr);

        function getClient(_client) {
            window.client = _client;
            onAppActivate()
        }
    }
};

function onAppActivate() {
    document.getElementById("generate").addEventListener("fwClick", async function () {
        await client.interface.trigger("showNotify", {
            type: "error",
            title: "Error!!",
            message: "Invalid ticket!"
        });
        await client.request.invoke('generateTicket', { solution_id: "xau" })
    })
}

function getLoggedInUser() {
    return client.data.get("loggedInUser").then(
        function (response) {
            return response.loggedInUser;
        },
        function (error) {
            console.error('Error while getting logged in user' + JSON.stringify(error));
        }
    );
}

function getCurrentTicket() {
    return client.data.get("ticket").then(
        function (data) {
            return data.ticket;
        },
        function (error) {
            // failure operation
            console.error('Error while fetching ticket details ' + JSON.stringify(error));
        }
    );
}

function handleErr(err) {
    console.error(`Unable to show agent's saved tickets`, err);
}