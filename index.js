const AWS = require('aws-sdk');

const QS_KEYS = ['name', 'description', 'lengthcms', 'widthcms', 'heightcms', 'weightgms', 'valueaud'];

exports.handler = (event, context, callback) => {
  const params = prepareParams(event);

  if (params) {
    const S3 = new AWS.S3();
    S3.upload(params, (err, data) => {
      if (err) {
        console.log(`Error: ${err.message}`);
        callback('Error!', {
          statusCode: 400,
          body: {message: err.message},
        });
      } else {
        console.info(`ETag: ${data}`);
        callback(null, {
          statusCode: 200,
          body: {object_id: params.Key, url: data.Location},
        });
      }
    });
  } else {
    console.info(event.info);
    callback(null, {
      statusCode: 400,
      body: {message: 'Valid querystring must include: ' + QS_KEYS},
    });
  }
};

/**
 * Checks for required keys in the event querystring collection.
 */
const validateQuerystringParams = (event) => {
  for (const k of QS_KEYS) {
    const p = event.queryStringParameters[k];
    if (typeof(p) === 'undefined' || p == '') return false;
  }
  return true;
};

/**
 * Prepares S3 bucket params.
 */
const prepareParams = (event) => {
  if (validateQuerystringParams(event)) {
    const bucketTarget = process.env.BUCKET;
    const objectKey = makeBucketKeyName(event.queryStringParameters.name);
    const objectBody = JSON.stringify(event.queryStringParameters);
    const params = {
      Bucket: bucketTarget,
      Key: objectKey,
      Body: objectBody,
      Storage: 'STANDARD',
    };
    return params;
  } else {
    return null;
  }
};

/**
 * Generates bucket key name.
 */
const makeBucketKeyName = (dataName) => {
  const SUFFIX = '_widget.json';
  const dataNameLower = dataName.toLowerCase();
  return `${Date.now()}_${dataNameLower}${SUFFIX}`;
};
