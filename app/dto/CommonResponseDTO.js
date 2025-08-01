class CommonResponseDTO {
    code = '';
    message = '';
    error = '';
    data;
    constructor(code, message, error, data) {
      this.code = code;
      this.message = message;
      this.error = error;
      this.data = data;
    }
  }
  /**
   * should return in every function
   * code = Related Http Code
   * message = User message
   * error = FE developer error object {error: error.message, userMessage: "Health check failed."},
   * data  =  data object for FE
   */
  module.exports = CommonResponseDTO;
  