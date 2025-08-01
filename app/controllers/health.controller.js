const CommonResponseDTO = require("../dto/CommonResponseDTO");
const Constants = require("../constants/constants");
const { StatusCodes} = require('http-status-codes');

exports.healthCheck = async (req, res) => {
    
    try{
      const responseDTO = new CommonResponseDTO(
        StatusCodes.OK,
        "Health check passed without jwt verification successfully.",
        null, 
        null
      );
      return res.status(StatusCodes.OK).send(responseDTO);
    }
    catch(error) {
      console.log(error);
      const responseDTO = new CommonResponseDTO(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Health check failed.",
        {error: error.message, userMessage: "Health check failed."},
        null,
      );
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(responseDTO);
    }
  };