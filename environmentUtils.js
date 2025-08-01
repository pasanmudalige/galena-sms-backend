const dotenv = require("dotenv");

const Environment = {
  LOCAL: "local",
  DEV: "dev",
  PROD: "prod",
  STAGE: "stage",
};

module.exports = () => {
  try {
    const environment = Environment.LOCAL;

    const result = dotenv.config({
      path: `.env.${environment}`,
    });

    if (result.error) {
      throw result.error;
    }

    console.log(
      `Loaded ${environment} environment variables from .env.${environment}`
    );

    return result.parsed;
  } catch (error) {
    console.log(`Loaded environment variables in ERROR................`);
  }
};
