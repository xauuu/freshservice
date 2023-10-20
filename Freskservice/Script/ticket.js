var form = document.createElement("fw-form");
var formContainer = document.querySelector("#form-container");
document.querySelector("#submit").addEventListener("click", async (e) => {
  const { values, isValid } = await form.doSubmit(e);
  console.log({ values, isValid });
  jQuery.ajax({
    url: '/api/v2/tickets/{{last (split ticket.human_display_id "-")}}',
    type: "PUT",
    headers: authHeader,
    data: JSON.stringify({
      custom_fields: {
        ticket_state: 1
      }
    }),
    success: function (data) {
      console.log(data);
    },
    error: function (err) {
      console.log("Error in update ticket: " + err);
    }
  });
});
var formSchema = {
  name: "Make a construction plan",
  fields: [
    {
      id: "2978f820-704b-46c7-9f88-110e14e34a8c",
      name: "first_name",
      label: "First Name",
      type: "TEXT",
      position: 3,
      required: true,
      placeholder: "Enter…",
      hint: "Please provide a text of at max 100 characters",
      choices: []
    }
  ]
};
var initialValues = {};
formContainer.prepend(form);

form.formSchema = formSchema;
form.initialValues = initialValues;
