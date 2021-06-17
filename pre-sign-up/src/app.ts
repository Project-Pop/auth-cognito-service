exports.handler = async (event: any, context: any) => {
  console.log(event);
  event.response.autoConfirmUser = true;
  event.response.autoVerifyPhone = true;
  return event;
};
