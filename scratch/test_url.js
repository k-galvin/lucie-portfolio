const originalUrl = 'https://firebasestorage.googleapis.com/v0/b/lucie-portfolio-art.firebasestorage.app/o/artwork%2F1780708322735_Kyoto%20%E7%B5%84%E5%AD%90%20Kumiko%202023%20Lucie%20Galvin%20paper%20and%20glue%20collage%2011x14%20in%20Large%202.webp?alt=media&token=fe282651-7baf-47b9-acdb-101ab0efaaeb';
const optimizedUrl = 'https://ik.imagekit.io/ytblv4ay6/v0/b/lucie-portfolio-art.firebasestorage.app/o/artwork%2F1780708322735_Kyoto%20%E7%B5%84%E5%AD%90%20Kumiko%202023%20Lucie%20Galvin%20paper%20and%20glue%20collage%2011x14%20in%20Large%202.webp?alt=media&token=fe282651-7baf-47b9-acdb-101ab0efaaeb&tr=f-auto,w-1000';

async function testUrl(name, url) {
  console.log(`Testing ${name}...`);
  const start = Date.now();
  try {
    const res = await fetch(url);
    const end = Date.now();
    console.log(`- Status: ${res.status} ${res.statusText}`);
    console.log(`- Content-Type: ${res.headers.get('content-type')}`);
    console.log(`- Content-Length: ${res.headers.get('content-length')} bytes (${(res.headers.get('content-length') / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`- Cache-Control: ${res.headers.get('cache-control')}`);
    console.log(`- Time: ${end - start} ms`);
    
    const ikCache = res.headers.get('x-ik-cache') || res.headers.get('x-cache');
    if (ikCache) console.log(`- Cache Header: ${ikCache}`);
    
  } catch (err) {
    console.error(`- Error:`, err);
  }
  console.log('-----------------------------------');
}

async function run() {
  await testUrl('Original Firebase URL', originalUrl);
  await testUrl('Optimized ImageKit URL', optimizedUrl);
}

run();
