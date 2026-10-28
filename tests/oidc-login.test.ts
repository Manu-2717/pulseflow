import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createHash, randomBytes } from 'node:crypto'
import { generateKeyPair, exportJWK, SignJWT } from 'jose'
import { betterAuth } from 'better-auth'
import { memoryAdapter } from 'better-auth/adapters/memory'
import { genericOAuth } from 'better-auth/plugins/generic-oauth'
import { fossclubProfile, getFossclubProvider } from '../src/lib/fossclub-oidc'
import { signInError } from '../src/lib/sign-in-error'

async function main(){
 assert.equal(getFossclubProvider({}),null)
 assert.throws(()=>getFossclubProvider({OIDC_ENABLED:'true',OIDC_CLIENT_ID:'pulseflow',OIDC_CLIENT_SECRET:'x'.repeat(48),OIDC_ISSUER:'http://identity.example',NODE_ENV:'production'}),/HTTPS/)
 assert.throws(()=>getFossclubProvider({OIDC_ENABLED:'true',OIDC_CLIENT_ID:'pulseflow',OIDC_CLIENT_SECRET:'short'}),/secret/)
 const mapped=fossclubProfile({sub:'stable-subject',name:'Test member',email:'TEST@example.invalid',email_verified:true,role:'LEADER',member:true})
 assert.equal(mapped.email,'test@example.invalid');assert.equal('role' in mapped,false);assert.equal('member' in mapped,false)
 assert.equal(fossclubProfile({sub:'stable',email:'test@example.invalid',email_verified:'true'}).emailVerified,false)
 assert.throws(()=>fossclubProfile({email:'test@example.invalid'}),/subject/)
 assert.ok(!signInError('<script>private-value</script>').includes('private-value'))

 const {privateKey,publicKey}=await generateKeyPair('RS256',{extractable:true})
 const jwk=await exportJWK(publicKey);Object.assign(jwk,{kid:'test-key',alg:'RS256',use:'sig'})
 const clientSecret=randomBytes(48).toString('base64url')
 const codes=new Map<string,{nonce:string;challenge:string;mode:string}>()
 let issuer='',tokenRequests=0
 const server=createServer(async(req,res)=>{
  const url=new URL(req.url||'/',issuer)
  const json=(status:number,data:unknown)=>{res.writeHead(status,{'content-type':'application/json'});res.end(JSON.stringify(data))}
  if(url.pathname==='/.well-known/openid-configuration')return json(200,{issuer,authorization_endpoint:issuer+'/auth',token_endpoint:issuer+'/token',userinfo_endpoint:issuer+'/me',jwks_uri:issuer+'/jwks',response_types_supported:['code'],id_token_signing_alg_values_supported:['RS256'],token_endpoint_auth_methods_supported:['client_secret_basic'],code_challenge_methods_supported:['S256']})
  if(url.pathname==='/jwks')return json(200,{keys:[jwk]})
  if(url.pathname==='/token'){
   tokenRequests++
   assert.equal(req.headers.authorization,'Basic '+Buffer.from('pulseflow:'+clientSecret).toString('base64'))
   let body='';for await(const chunk of req)body+=chunk
   const data=new URLSearchParams(body),code=data.get('code')||'',entry=codes.get(code);codes.delete(code)
   if(!entry||createHash('sha256').update(data.get('code_verifier')||'').digest('base64url')!==entry.challenge)return json(400,{error:'invalid_grant'})
   const token=await new SignJWT({sub:'stable-subject',name:'Test member',email:'oidc-test@example.invalid',email_verified:!entry.mode.startsWith('unverified'),role:'LEADER',nonce:entry.mode==='nonce'?'wrong-nonce':entry.nonce})
    .setProtectedHeader({alg:'RS256',kid:'test-key'}).setIssuer(entry.mode==='issuer'?'https://wrong-issuer.invalid':issuer).setAudience(entry.mode==='audience'?'other-client':'pulseflow').setIssuedAt().setExpirationTime(entry.mode==='expired'?Math.floor(Date.now()/1000)-600:'10m').sign(privateKey)
   const idToken=entry.mode==='signature'?token.slice(0,-8)+'aaaaaaaa':token
   return json(200,{access_token:'mock-access-token',id_token:idToken,token_type:'Bearer',expires_in:600})
  }
  return json(404,{error:'not_found'})
 })
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve))
 const address=server.address();assert.ok(address&&typeof address==='object');issuer=`http://127.0.0.1:${address.port}`
 const base='http://localhost:44001'
 try{
  for(const mode of ['success','nonce','issuer','audience','signature','expired','unverified','unverified-existing','state']){
   const db:{[key:string]:unknown[]}={user:[],session:[],account:[],verification:[]}
   if(mode==='unverified-existing'){
    db.user.push({id:'existing-user',name:'Existing user',email:'oidc-test@example.invalid',emailVerified:true,createdAt:new Date(),updatedAt:new Date()})
    db.account.push({id:'existing-google',userId:'existing-user',providerId:'google',accountId:'existing-google-subject',createdAt:new Date(),updatedAt:new Date()})
   }
   const config=getFossclubProvider({OIDC_ENABLED:'true',OIDC_ISSUER:issuer,OIDC_CLIENT_ID:'pulseflow',OIDC_CLIENT_SECRET:clientSecret,NODE_ENV:'development'})!
   const auth=betterAuth({baseURL:base,secret:'test-only-session-secret-at-least-32-characters',database:memoryAdapter(db),logger:{disabled:true},plugins:[genericOAuth({config:[config]})]})
   const start=await auth.handler(new Request(base+'/api/auth/sign-in/social',{method:'POST',headers:{origin:base,'content-type':'application/json'},body:JSON.stringify({provider:'fossclub',callbackURL:'/onboarding',errorCallbackURL:'/login'})}))
   assert.equal(start.status,200,`Sign-in initialization: ${mode}`)
   const authorization=new URL((await start.json()).url)
   assert.equal(authorization.searchParams.get('code_challenge_method'),'S256')
   assert.equal(authorization.searchParams.get('redirect_uri'),base+'/api/auth/callback/fossclub')
   assert.equal(authorization.searchParams.get('scope')?.includes('club'),false)
   const nonce=authorization.searchParams.get('nonce'),state=authorization.searchParams.get('state'),challenge=authorization.searchParams.get('code_challenge')
   assert.ok(nonce&&state&&challenge,'Nonce, state and PKCE challenge are required')
   const code=randomBytes(12).toString('hex');codes.set(code,{nonce,challenge,mode})
   const cookies=start.headers.getSetCookie().map(cookie=>cookie.split(';')[0]).join('; ')
   const before=tokenRequests
   const callback=await auth.handler(new Request(base+'/api/auth/callback/fossclub?'+new URLSearchParams({code,state:mode==='state'?'tampered-state':state}),{headers:{cookie:cookies}}))
   assert.equal(callback.status,302,`Callback response: ${mode}`)
   if(mode==='success'){
    assert.equal(db.session.length,1)
    assert.equal(db.account.length,1)
    assert.equal((db.account[0] as {accountId:string}).accountId,'stable-subject')
    assert.equal('role' in (db.user[0] as object),false)
    assert.equal(new URL(callback.headers.get('location')!,base).pathname,'/onboarding')
   }else{
    assert.equal(db.session.length,0,`Invalid ${mode} must not create a session`)
    assert.ok(callback.headers.get('location')?.includes('error='),`Invalid ${mode} must return an error`)
    if(mode==='state')assert.equal(tokenRequests,before,'Invalid state must not exchange tokens')
   }
  }
 }finally{server.closeAllConnections();await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()))}
 console.log('PASS: OIDC code flow, Basic client authentication, PKCE, stable subject, verified email and role isolation; invalid nonce, issuer, audience, signature, expiry and state rejected.')
}
main().catch(error=>{console.error(error);process.exitCode=1})
