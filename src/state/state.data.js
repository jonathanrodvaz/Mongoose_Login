let testEmailSend = false;
//Importante: siempre que se consuma el estado tenemos que volver en el controlador al final a su estado incial

const setTestEmailSend = (data) => {
  testEmailSend = data;
};

const getTestEmailSend = () => {
  return testEmailSend;
};

module.exports = { setTestEmailSend, getTestEmailSend };