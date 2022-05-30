const slugid = require('slugid')

const convertFromUuid = (result) => {
  if (!result || !(result instanceof Array)) return result
  return result.map(resultItem => {
    const convertedItem = {}
    for (const key of Object.keys(resultItem)) {
      if ((key.includes('_id') || key === 'id') && resultItem[key] && resultItem[key] !== 'null') {
        convertedItem[key] = slugid.encode(resultItem[key])
      } else {
        convertedItem[key] = resultItem[key]
      }
    }
    return convertedItem
  })
}

const convertToUuid = (args) => {
  const convertedArgs = {}
  for (const key of Object.keys(args)) {
    if ((key.includes('_id') || key === 'id') && args[key] && args[key] !== 'null') {
      convertedArgs[key] = slugid.decode(args[key])
    } else {
      convertedArgs[key] = args[key]
    }
  }
  return convertedArgs
}

const invoke = (lambda, functionName, payload) => {
  const params = {
    FunctionName: functionName,
    InvocationType: 'Event',
    Payload: JSON.stringify(payload),
  }
  return new Promise((resolve, reject) => {
    lambda.invoke(params, (err, data) => {
      if (err) {
        console.log(err, err.stack)
        reject(err)
      } else {
        console.log(data)
        resolve(data)
      }
    })
  })
}

module.exports = {
  invoke,
  convertFromUuid,
  convertToUuid,
}