export function safeNextPath(value:unknown,fallback='/onboarding'){
 if(typeof value!=='string'||!value.startsWith('/')||value.startsWith('//')||value.includes('\\')||value.includes('\n'))return fallback
 return value
}
