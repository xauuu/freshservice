window.frsh_init().then(function (client) {
  document.getElementById("closeModal").addEventListener("click", function () {
    client.instance.close();
  });
  document.getElementById("create").addEventListener("click", function () {
    const name = document.getElementById("name").value;
    const address = document.getElementById("address").value;
    const code = document.getElementById("code").value || "";
    const postal_code = document.getElementById("postal_code").value || "";
    client.instance.send({ message: { name, address, code, postal_code } });
  });
  client.instance.receive(function (event) {
    let data = event.helper.getData();
    if (data) client.instance.close();
  });
});
