
function isError(obj) {
  return Object.prototype.toString.call(obj) === '[object Error]';
}

function errorToString(err) {
  return isError(err) ? err.toString() : '';
}

module.exports = {
  isError,
  errorToString,
};
