import { ImageResponse } from 'next/og'

export const size = {width:180,height:180}
export const contentType = 'image/png'
export default function AppleIcon(){return new ImageResponse(<div style={{width:180,height:180,display:'flex',alignItems:'center',justifyContent:'center',background:'#8ee6ae',color:'#142719',fontFamily:'Arial, sans-serif',fontSize:74,fontWeight:900}}>PF</div>,size)}
