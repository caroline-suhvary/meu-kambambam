export const MAX_BYTES = 1_048_576; // 1 MiB (o painel chama de 1 MB).
export const PUBLIC_EXTENSIONS = ['pdf','png'];
export const PRIVATE_EXTENSIONS = ['pdf','png','jpg','jpeg','docx','xlsx','xls','zip','txt'];
export function validateFile(name:string,size:number,isPublic:boolean) {
 const extension=name.split('.').pop()?.toLowerCase() ?? '';
 if (size <= 0 || size > MAX_BYTES) throw new Error('O arquivo deve ter entre 1 byte e 1 MB.');
 if (!(isPublic ? PUBLIC_EXTENSIONS : PRIVATE_EXTENSIONS).includes(extension)) throw new Error('Formato não permitido neste quadro.');
 return extension;
}
export function safeLink(value:string) {
 const url=new URL(value);
 if (!['https:','http:'].includes(url.protocol) || url.username || url.password) throw new Error('Use um link http ou https sem credenciais.');
 return url.href;
}
