import { ImageResponse } from 'next/og'

export const alt = 'PulseFlow — a little more flow, a little less friction'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() { return new ImageResponse(<div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',justifyContent:'space-between',padding:70,background:'#f5f0df',color:'#16251a',fontFamily:'Arial, sans-serif'}}><div style={{display:'flex',fontSize:30,fontWeight:800}}>pulseflow</div><div style={{display:'flex',flexDirection:'column'}}><div style={{display:'flex',flexDirection:'column',fontSize:92,fontWeight:900,lineHeight:1.04,letterSpacing:-5}}><span>Less stuck.</span><span>More flow.</span></div><div style={{display:'flex',fontSize:26,marginTop:30,color:'#3b6045'}}>Team capacity · task dispatch · blocker resolution</div></div><div style={{display:'flex',height:15,width:400,background:'#8ee6ae',borderRadius:20}}/></div>,size) }
