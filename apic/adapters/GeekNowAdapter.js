export async function buildImageRequest(params, prompt, helpers) {
  if (!params.model) throw new Error('Model not specified');
  
  const config = helpers.getProviderConfig('geeknow');
  const apiUrl = config.apiUrl.replace(/\/+$/, '');
  const apiKey = config.apiKey || params.apiKey;
  
  if (!apiKey) throw new Error('GeekNow API Key not configured');
  
  const processedImages = await helpers.processInputImages(params.inputUrls, apiKey, {
    compress: true,
    maxDim: 2048,
    quality: 0.9
  });
  
  const modelMap = {
    'geeknow/seedream-4.0': 'seedream-4.0',
    'geeknow/seedream-4.5': 'seedream-4.5',
    'geeknow/seedream-5.0-lite': 'seedream-5.0-lite',
    'geeknow/nano-banana-2': 'nano-banana-2',
    'geeknow/nano-banana-pro': 'nano-banana-pro'
  };
  
  const modelName = modelMap[params.model] || (params.model.startsWith('geeknow/') ? params.model.replace('geeknow/', '') : null);
  if (!modelName) throw new Error('Unsupported model: ' + params.model);
  
  const aspectRatioMap = {
    '1:1': '1:1',
    '9:16': '9:16',
    '16:9': '16:9',
    '3:4': '3:4',
    '4:3': '4:3',
    '3:2': '3:2',
    '2:3': '2:3',
    '5:4': '5:4',
    '4:5': '4:5',
    '21:9': '21:9'
  };
  
  let resolution = params.imageSize || '2K';
  if ((params.model === 'geeknow/seedream-4.5' || params.model === 'geeknow/seedream-5.0-lite') && resolution === '1K') {
    resolution = '2K';
  }
  if (params.model === 'geeknow/seedream-4.0' && resolution === '4K') {
    resolution = '3K';
  }
  
  const requestBody = {
    model: modelName,
    prompt: prompt,
    size: aspectRatioMap[params.aspectRatio] || '1:1',
    resolution: resolution,
    n: 1
  };
  
  if (processedImages.length > 0) {
    requestBody.inputUrls = processedImages;
  }
  
  return {
    url: '/api/v2/proxy/image',
    headers: { 'Content-Type': 'application/json' },
    body: {
      apiUrl: apiUrl + '/v1/images/generations',
      apiKey: apiKey,
      ...requestBody
    }
  };
}

export async function buildVideoRequest(params, prompt, helpers) {
  if (!params.model) throw new Error('Model not specified');
  
  const config = helpers.getProviderConfig('geeknow');
  const apiUrl = config.apiUrl.replace(/\/+$/, '');
  const apiKey = config.apiKey || params.apiKey;
  
  if (!apiKey) throw new Error('GeekNow API Key not configured');
  
  const modelMap = {
    'geeknow/seedance-4.0': 'seedance-4.0',
    'geeknow/seedance-4.5': 'seedance-4.5'
  };
  
  const modelName = modelMap[params.model] || (params.model.startsWith('geeknow/') ? params.model.replace('geeknow/', '') : null);
  if (!modelName) throw new Error('Unsupported model: ' + params.model);
  
  const aspectRatioMap = {
    '1:1': '1:1',
    '9:16': '9:16',
    '16:9': '16:9',
    '3:4': '3:4',
    '4:3': '4:3'
  };
  
  const requestBody = {
    model: modelName,
    prompt: prompt,
    size: aspectRatioMap[params.aspectRatio] || '16:9',
    duration: params.duration || 5
  };
  
  return {
    url: '/api/v2/proxy/video',
    headers: { 'Content-Type': 'application/json' },
    body: {
      apiUrl: apiUrl + '/v1/videos/generations',
      apiKey: apiKey,
      ...requestBody
    }
  };
}
