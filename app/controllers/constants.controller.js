const { httpResponseCode } = require("../constants/httpResponseCode");
const Constants = require("../constants/constants");

exports.getALYears = async (req, res) => {
  try {
    return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
      code: httpResponseCode.HTTP_RESPONSE_OK,
      message: "A/L years fetched successfully",
      data: Constants.AL_YEARS,
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to fetch A/L years",
      error: error?.message || error,
    });
  }
};


