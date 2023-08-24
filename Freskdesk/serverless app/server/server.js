exports = {
  // args is a JSON block containing the payload information.
  // args['iparam'] will contain the installation parameter values.
  onTicketCreateHandler: async function (args) {
    const reqBody = JSON.stringify(args);
    const options = {
      body: reqBody
    };
    try {
      const { response } = await $request.invokeTemplate("createTicket", options);

      console.log(response);
    } catch (error) {
      console.error("Something went wrong. Webhook De-Registration has failed", error);
    }
  }
};
