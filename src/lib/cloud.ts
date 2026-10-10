export async function cloud<T = unknown>(path: string, method = "GET", data?: unknown, signal?: AbortSignal): Promise<T> {
 const response=await fetch(path,{method,credentials:'same-origin',headers:data?{'Content-Type':'application/json'}:undefined,body:data?JSON.stringify(data):undefined,signal});
 const result=await response.json();if(!response.ok)throw new Error(result.error||'server_error');return result;
}
export function download(name:string,content:string,type='text/plain;charset=utf-8'){
 const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);
}
export function csv(rows:Record<string,unknown>[]){
 const keys=[...new Set(rows.flatMap(row=>Object.keys(row)))];
 const cell=(value:unknown)=>{let s=String(value??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
 return [keys.map(cell).join(','),...rows.map(row=>keys.map(k=>cell(row[k])).join(','))].join('\r\n');
}
