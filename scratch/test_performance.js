const images = [
  'https://firebasestorage.googleapis.com/v0/b/lucie-portfolio-art.firebasestorage.app/o/artwork%2F1780685680118_Construction%20Fence%202024%20Lucie%20Galvin%20paper%20and%20glue%20collage%2020x10%20in%20Large.webp?alt=media&token=f715ecdb-2b6b-4b40-90f8-bd14c6a11020',
  'https://firebasestorage.googleapis.com/v0/b/lucie-portfolio-art.firebasestorage.app/o/artwork%2F1780778483166_Shed%202024%20Lucie%20Galvin%20paper%20and%20glue%20collage%2075x78%20in.webp?alt=media&token=f335b1a0-ea1d-497a-9657-ae57e4d9ab90',
  'https://firebasestorage.googleapis.com/v0/b/lucie-portfolio-art.firebasestorage.app/o/artwork%2F1780779844921_Well%20Done%202024%20Lucie%20Galvin%20paper%2C%20cord%2C%20and%20glue%2036x24%20in%202%20Large.webp?alt=media&token=33d5dde4-96fb-488d-a754-6284ccee2301'
];

const imageKitEndpoint = 'https://ik.imagekit.io/ytblv4ay6';

function getOptimizedUrl(firebaseUrl, width = 1000) {
  const relativePath = firebaseUrl.split('firebasestorage.googleapis.com')[1];
  return `${imageKitEndpoint}${relativePath}&tr=f-auto,w-${width}`;
}

async function testUrl(url, label) {
  console.log(`Testing ${label}...`);
  const start = Date.now();
  try {
    const res = await fetch(url);
    const end = Date.now();
    console.log(`- Status: ${res.status}`);
    console.log(`- Time: ${end - start} ms`);
    console.log(`- Content-Type: ${res.headers.get('content-type')}`);
    console.log(`- Content-Length: ${res.headers.get('content-length')} bytes`);
    console.log(`- Cache-Control: ${res.headers.get('cache-control')}`);
    console.log(`- X-Cache: ${res.headers.get('x-cache')}`);
    console.log(`- X-IK-Cache: ${res.headers.get('x-ik-cache')}`);
    console.log(`- Age: ${res.headers.get('age')}`);
  } catch (err) {
    console.error(`- Error:`, err);
  }
  console.log('-----------------------------------');
}

async function run() {
  for (let i = 0; i < images.length; i++) {
    const firebaseUrl = images[i];
    const optimizedUrl = getOptimizedUrl(firebaseUrl);
    
    console.log(`=== IMAGE ${i + 1} ===`);
    await testUrl(optimizedUrl, 'First Fetch (Possible Cold Cache)');
    await testUrl(optimizedUrl, 'Second Fetch (Hot Cache)');
  }
}

run();
