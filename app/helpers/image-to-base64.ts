export async function imageLinkToBase64(url: string) {
  try {
    //1. Use fetch to get the image data
    const response = await fetch(url);
    // check if the fetch was successful
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    // 2. get the response body as an ArrayBuffer
    const arrayBuffer = await response.arrayBuffer();

    // 3. Convert ArrayBuffer to Nnode.js Buffer
    const buffer = Buffer.from(arrayBuffer);

    //4. Determine the MIME type (crutial for Base64 data URL)
    const contentType =
      response.headers.get("Conten-Type") || "image/webp" || "image/jpg";

    //5. Convert the Buffer to a Base64 string and prepend the data URL header
    const base64Data = buffer.toString("base64");

    return `data:${contentType};base64,${base64Data}`;
  } catch (error) {
    console.error("Server-side image conversion error:", error);
    return url;
  }
}
