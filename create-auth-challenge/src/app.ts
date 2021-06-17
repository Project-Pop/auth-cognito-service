import AWS from "aws-sdk";

import http from "http";

async function sendSMS(phone: string, code: number) {
  // -------------------------------------------------
  // sending otp message through 2factor
  const options = {
    hostname: "2factor.in",
    path: `/API/V1/d398fdc2-8116-11eb-a9bc-0200cd936042/SMS/${phone}/${code}/autoTemplate`,
    method: "GET",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
  };

  return new Promise<void>((resolve, reject) => {
    const req = http.request(options, (res) => {
      console.log(`statusCode: ${res.statusCode}`);
      resolve();
    });

    req.on("error", (error) => {
      console.error(error);
      reject();
    });

    req.end();
  });

  // ---------------------------------------------
  // sending message through AWS SNS

  // const params = {
  //   Message: `OTP - ${code}`,
  //   /* required */
  //   PhoneNumber: phone,
  // };

  // const sns = new AWS.SNS();
  // await sns.setSMSAttributes({
  //     attributes: {
  //         'DefaultSMSType': 'Transactional'
  //     }
  // }).promise()

  // return sns.publish(params).promise();
}

exports.handler = async (event: any, context: any) => {
  console.log("CUSTOM_CHALLENGE_LAMBDA", event.request);

  let secretLoginCode;
  if (!event.request.session || !event.request.session.length) {
    // Generate a new secret login code and send it to the user
    secretLoginCode = Math.floor(Math.random() * (999999 - 100001) + 100001);

    console.log("secretLoginCode: ", secretLoginCode);

    try {
      await sendSMS(event.request.userAttributes.phone_number, secretLoginCode);
    } catch (error) {
      console.log("error in publishing sms: ", error);
      // Handle SMS Failure
    }
  } else {
    // re-use code generated in previous challenge
    const previousChallenge = event.request.session.slice(-1)[0];
    secretLoginCode =
      previousChallenge.challengeMetadata.match(/CODE-(\d*)/)[1];
  }

  console.log(event.request.userAttributes);

  // Add the secret login code to the private challenge parameters
  // so it can be verified by the "Verify Auth Challenge Response" trigger
  event.response.privateChallengeParameters = {
    secretLoginCode,
  };

  // Add the secret login code to the session so it is available
  // in a next invocation of the "Create Auth Challenge" trigger
  event.response.challengeMetadata = `CODE-${secretLoginCode}`;

  return event;
};
