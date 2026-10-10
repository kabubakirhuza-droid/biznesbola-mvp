import sharp from 'sharp';
export async function prepareImage(data:string){
 const match=/^data:image\/(webp|png|jpeg);base64,([A-Za-z0-9+/=]+)$/.exec(data);if(!match)throw new Error('invalid_image');
 const bytes=Buffer.from(match[2],'base64');if(bytes.length>5*1024*1024)throw new Error('image_too_large');
 const pipeline=sharp(bytes,{limitInputPixels:16000000,failOn:'error'});const metadata=await pipeline.metadata();
 if(!['png','jpeg','webp'].includes(metadata.format||'')||(metadata.pages||1)>1)throw new Error('invalid_image');
 let output=await pipeline.rotate().resize({width:1000,height:1000,fit:'inside',withoutEnlargement:true}).webp({quality:75}).toBuffer();
 if(output.length>307200)output=await sharp(output).resize({width:600,height:600,fit:'inside'}).webp({quality:55}).toBuffer();
 if(output.length>307200)throw new Error('image_too_large');return output;
}
