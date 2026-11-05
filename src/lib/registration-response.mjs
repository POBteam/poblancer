// Freeio's native callback can return JSON under a text/html Content-Type.
export function parseRegistrationResponse(text){
 const value=JSON.parse(text);
 if(!value||Array.isArray(value)||typeof value!=='object'||typeof value.status!=='boolean')throw new Error('Unrecognized registration response.');
 return value;
}
