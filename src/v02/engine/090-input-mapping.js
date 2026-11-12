// ---------- unified input mapping ----------
// Gameplay consumes named actions only. Raw Gamepad API indices live here and nowhere else.
const GamepadMap={
 axes:{moveX:0,moveY:1,lookX:2,lookY:3},
 buttons:{jump:0,brake:1,dodge:2,railRead:3,brace:4,sprint:5,aim:6,fire:7,pause:9,sprintAlt:10,recenter:11,railReadAlt:12,reset:13,shoulderLeft:14,shoulderRight:15}
};
const pad={connected:false,index:null,id:'',mapping:'',prevButtons:[],jumpQueued:false,fireQueued:false};
